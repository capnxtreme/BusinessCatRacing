# Business Cat Racing - Architecture Refactoring Guide

## Overview
This document outlines the architectural improvements needed to transform Business Cat Racing from its current monolithic structure into a scalable, maintainable system. Based on the external audit findings, these changes should be implemented early to avoid costly refactoring later.

---

## Current Architecture Issues

### 1. Monolithic Game Class
The Game class currently handles too many responsibilities:
- Renderer management
- Physics world updates
- Input processing
- Camera control
- Entity management
- Game loop coordination

### 2. Tight Coupling
Systems directly reference each other, making it difficult to:
- Add new features without modifying existing code
- Test systems in isolation
- Reuse components
- Maintain clear boundaries

### 3. Missing Patterns
- No event system for communication
- No clear separation of concerns
- Limited error handling
- No performance monitoring

---

## Target Architecture

### System-Based Architecture
Transform the monolithic Game class into a lightweight coordinator that manages independent systems.

```typescript
// src/core/Game.ts
export class Game {
  private systems: GameSystem[] = [];
  private eventBus: EventBus;
  
  constructor() {
    this.eventBus = new EventBus();
    this.registerSystems();
  }
  
  private registerSystems(): void {
    this.systems.push(
      new RenderSystem(this.eventBus),
      new PhysicsSystem(this.eventBus),
      new InputSystem(this.eventBus),
      new AudioSystem(this.eventBus),
      new RaceSystem(this.eventBus),
      new UISystem(this.eventBus)
    );
  }
  
  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }
}
```

### Event-Driven Communication
Implement a publish-subscribe event system for loose coupling.

```typescript
// src/core/EventBus.ts
export interface GameEvent {
  type: string;
  data?: any;
}

export class EventBus {
  private listeners: Map<string, Array<(event: GameEvent) => void>> = new Map();
  
  on(eventType: string, callback: (event: GameEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }
  
  emit(event: GameEvent): void {
    const callbacks = this.listeners.get(event.type) || [];
    for (const callback of callbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }
  
  off(eventType: string, callback: (event: GameEvent) => void): void {
    const callbacks = this.listeners.get(eventType) || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
}
```

### System Base Class
All systems inherit from a common base for consistency.

```typescript
// src/core/GameSystem.ts
export abstract class GameSystem {
  protected eventBus: EventBus;
  protected enabled: boolean = true;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.registerEventListeners();
  }
  
  abstract update(deltaTime: number): void;
  abstract registerEventListeners(): void;
  
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
```

---

## System Implementations

### 1. Physics System
```typescript
// src/systems/PhysicsSystem.ts
export class PhysicsSystem extends GameSystem {
  private world: CANNON.World;
  private bodies: Map<string, CANNON.Body> = new Map();
  
  registerEventListeners(): void {
    this.eventBus.on('entity:spawn', (event) => this.onEntitySpawn(event));
    this.eventBus.on('entity:destroy', (event) => this.onEntityDestroy(event));
  }
  
  update(deltaTime: number): void {
    if (!this.enabled) return;
    
    this.world.step(1/60, deltaTime);
    
    // Emit collision events
    for (const contact of this.world.contacts) {
      this.eventBus.emit({
        type: 'physics:collision',
        data: { bodyA: contact.bi, bodyB: contact.bj }
      });
    }
  }
}
```

### 2. Input System
```typescript
// src/systems/InputSystem.ts
export class InputSystem extends GameSystem {
  private keys: Map<string, boolean> = new Map();
  
  registerEventListeners(): void {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }
  
  update(deltaTime: number): void {
    if (!this.enabled) return;
    
    // Emit input events based on current state
    if (this.keys.get('w')) {
      this.eventBus.emit({ type: 'input:accelerate' });
    }
    if (this.keys.get('a')) {
      this.eventBus.emit({ type: 'input:steer', data: { direction: -1 } });
    }
    // ... etc
  }
}
```

### 3. Race System
```typescript
// src/systems/RaceSystem.ts
export class RaceSystem extends GameSystem {
  private checkpoints: Checkpoint[] = [];
  private playerProgress: Map<string, number> = new Map();
  
  registerEventListeners(): void {
    this.eventBus.on('physics:collision', (event) => this.checkCollision(event));
    this.eventBus.on('race:start', (event) => this.startRace(event));
  }
  
  private checkCollision(event: GameEvent): void {
    // Check if collision is with checkpoint
    const checkpoint = this.getCheckpointFromBody(event.data.bodyB);
    if (checkpoint) {
      this.eventBus.emit({
        type: 'checkpoint:passed',
        data: { playerId: event.data.bodyA.id, checkpoint }
      });
    }
  }
}
```

---

## Entity-Component-System (ECS) Pattern

### Entity Manager
```typescript
// src/core/EntityManager.ts
export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private componentsByType: Map<string, Map<string, Component>> = new Map();
  
  createEntity(): Entity {
    const entity = new Entity(generateId());
    this.entities.set(entity.id, entity);
    return entity;
  }
  
  addComponent(entityId: string, component: Component): void {
    const type = component.constructor.name;
    if (!this.componentsByType.has(type)) {
      this.componentsByType.set(type, new Map());
    }
    this.componentsByType.get(type)!.set(entityId, component);
  }
  
  getEntitiesWithComponent<T extends Component>(
    componentType: new () => T
  ): Array<[string, T]> {
    const components = this.componentsByType.get(componentType.name);
    if (!components) return [];
    return Array.from(components.entries()) as Array<[string, T]>;
  }
}
```

### Component Examples
```typescript
// src/components/Transform.ts
export class Transform extends Component {
  position: THREE.Vector3 = new THREE.Vector3();
  rotation: THREE.Quaternion = new THREE.Quaternion();
  scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
}

// src/components/PhysicsBody.ts
export class PhysicsBody extends Component {
  body: CANNON.Body;
  offset: THREE.Vector3 = new THREE.Vector3();
}

// src/components/Kart.ts
export class KartComponent extends Component {
  speed: number = 0;
  maxSpeed: number = 50;
  acceleration: number = 30;
  handling: number = 1.0;
}
```

---

## Error Handling Strategy

### Global Error Handler
```typescript
// src/core/ErrorHandler.ts
export class ErrorHandler {
  private eventBus: EventBus;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupGlobalHandlers();
  }
  
  private setupGlobalHandlers(): void {
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'global');
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'promise');
    });
  }
  
  handleError(error: Error, context: string): void {
    console.error(`[${context}] Error:`, error);
    
    this.eventBus.emit({
      type: 'error:occurred',
      data: { error, context, timestamp: Date.now() }
    });
    
    // Attempt recovery based on error type
    this.attemptRecovery(error, context);
  }
  
  private attemptRecovery(error: Error, context: string): void {
    if (error.message.includes('WebGL')) {
      this.eventBus.emit({ type: 'renderer:fallback' });
    } else if (error.message.includes('Audio')) {
      this.eventBus.emit({ type: 'audio:disable' });
    }
  }
}
```

### System-Level Error Boundaries
```typescript
export abstract class GameSystem {
  update(deltaTime: number): void {
    if (!this.enabled) return;
    
    try {
      this.safeUpdate(deltaTime);
    } catch (error) {
      console.error(`Error in ${this.constructor.name}:`, error);
      this.eventBus.emit({
        type: 'system:error',
        data: { system: this.constructor.name, error }
      });
      this.handleSystemError(error);
    }
  }
  
  protected abstract safeUpdate(deltaTime: number): void;
  protected abstract handleSystemError(error: Error): void;
}
```

---

## Performance Monitoring

### Performance Monitor System
```typescript
// src/systems/PerformanceMonitor.ts
export class PerformanceMonitor extends GameSystem {
  private frameTime: number = 0;
  private frameCount: number = 0;
  private lastReport: number = 0;
  
  update(deltaTime: number): void {
    this.frameTime += deltaTime;
    this.frameCount++;
    
    if (performance.now() - this.lastReport > 1000) {
      const fps = this.frameCount;
      const avgFrameTime = this.frameTime / this.frameCount;
      
      this.eventBus.emit({
        type: 'performance:stats',
        data: {
          fps,
          avgFrameTime,
          memory: (performance as any).memory?.usedJSHeapSize
        }
      });
      
      this.frameTime = 0;
      this.frameCount = 0;
      this.lastReport = performance.now();
    }
  }
}
```

---

## Migration Strategy

### Phase 1: Foundation (2 days)
1. Implement EventBus
2. Create GameSystem base class
3. Add ErrorHandler
4. Set up PerformanceMonitor

### Phase 2: System Extraction (3 days)
1. Extract PhysicsSystem
2. Extract RenderSystem
3. Extract InputSystem
4. Update Game class to use systems

### Phase 3: Feature Systems (2 days)
1. Create RaceSystem
2. Create AudioSystem
3. Create UISystem
4. Integrate with EventBus

### Phase 4: ECS Migration (Optional, 3 days)
1. Implement EntityManager
2. Convert Kart to ECS
3. Convert Track to ECS
4. Update systems to use ECS

---

## Benefits of New Architecture

### Maintainability
- Clear separation of concerns
- Easy to locate and fix bugs
- Reduced code duplication
- Better organization

### Extensibility
- Add new systems without modifying existing code
- Easy to add new features
- Plugin-like architecture
- Reusable components

### Testability
- Systems can be tested in isolation
- Mock EventBus for unit tests
- Clear interfaces
- Dependency injection

### Performance
- Systems can be toggled on/off
- Easy to profile individual systems
- Opportunity for parallelization
- Better memory management

---

## Code Examples

### Before (Monolithic)
```typescript
class Game {
  update(deltaTime: number) {
    // Everything mixed together
    this.inputManager.update();
    const input = this.inputManager.getInput();
    
    if (input.accelerate) {
      this.kart.accelerate();
    }
    
    this.physicsWorld.step(deltaTime);
    this.kart.syncPhysicsToVisuals();
    
    if (this.checkCheckpoint(this.kart.position)) {
      this.lapCount++;
      this.playSound('checkpoint');
    }
    
    this.camera.follow(this.kart);
    this.renderer.render(this.scene, this.camera);
  }
}
```

### After (System-Based)
```typescript
class Game {
  update(deltaTime: number) {
    // Clean and simple
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }
}

// Systems handle their own concerns
class InputSystem extends GameSystem {
  update(deltaTime: number) {
    if (this.keys.get('w')) {
      this.eventBus.emit({ type: 'input:accelerate' });
    }
  }
}

class KartSystem extends GameSystem {
  registerEventListeners() {
    this.eventBus.on('input:accelerate', () => {
      this.kart.accelerate();
    });
  }
}
```

---

## Conclusion

This architecture refactoring will provide a solid foundation for Business Cat Racing's growth. By implementing these changes early in Phase 1, we avoid the technical debt that would make future features difficult to implement. The event-driven, system-based approach will make the codebase more maintainable, testable, and extensible.