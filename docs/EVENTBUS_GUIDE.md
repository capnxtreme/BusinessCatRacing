# EventBus Usage Guide

## Overview

The EventBus is the core communication system for Business Cat Racing. It enables loose coupling between game systems by providing a publish-subscribe messaging pattern. Systems can communicate without direct dependencies, making the codebase more maintainable and extensible.

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ InputSystem │    │  EventBus   │    │ KartSystem  │
│             │───▶│             │───▶│             │
│ emit()      │    │ on()/emit() │    │ on()        │
└─────────────┘    └─────────────────┘    └─────────────┘
```

### Key Benefits

- **Loose Coupling**: Systems don't need direct references to each other
- **Scalability**: Easy to add new systems and features
- **Testing**: Systems can be tested in isolation
- **Debugging**: Event history and performance monitoring built-in
- **Error Isolation**: Errors in one listener don't affect others

## Basic Usage

### Importing

```typescript
import { EventBus, globalEventBus } from '../core/EventBus';
import { EventTypes } from '../types/events.types';
```

### Creating an EventBus

```typescript
// Use the global instance (recommended for most use cases)
const eventBus = globalEventBus;

// Or create a local instance
const eventBus = new EventBus({
  enableLogging: true,
  enablePerformanceMonitoring: true,
  maxListenersPerEvent: 50
});
```

### Subscribing to Events

```typescript
// Basic subscription
eventBus.on('input:accelerate', (event) => {
  console.log('Accelerate pressed!', event.data);
});

// One-time subscription
eventBus.once('race:start', (event) => {
  console.log('Race started!');
});

// With source tracking for debugging
eventBus.on('physics:collision', (event) => {
  console.log('Collision detected!', event.data);
}, 'CollisionSystem');
```

### Emitting Events

```typescript
// Emit with data
eventBus.emit('input:accelerate', { intensity: 0.8 });

// Emit without data
eventBus.emit('race:start');

// Emit with source tracking
eventBus.emit('physics:collision', {
  bodyA: 'kart1',
  bodyB: 'wall',
  force: 150
}, 'PhysicsSystem');
```

### Unsubscribing

```typescript
// Store the unsubscribe function
const unsubscribe = eventBus.on('test:event', listener);

// Call it when done
unsubscribe();

// Or use the off method
eventBus.off('test:event', listener);
```

## Game-Specific Patterns

### Input System Events

```typescript
// InputManager emits input events
class InputManager {
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
        eventBus.emit(EventTypes.INPUT_ACCELERATE, { intensity: 1.0 });
        break;
      case 'KeyA':
        eventBus.emit(EventTypes.INPUT_STEER, { direction: -1, intensity: 1.0 });
        break;
    }
  }
}

// KartSystem listens for input events
class KartSystem {
  constructor() {
    eventBus.on(EventTypes.INPUT_ACCELERATE, this.onAccelerate.bind(this));
    eventBus.on(EventTypes.INPUT_STEER, this.onSteer.bind(this));
  }

  private onAccelerate(event: GameEvent): void {
    const { intensity } = event.data as { intensity: number };
    this.kart.setThrottle(intensity);
  }
}
```

### Race Events

```typescript
// RaceManager emits race events
class RaceManager {
  private checkLapCompletion(kartId: string): void {
    if (this.isLapComplete(kartId)) {
      eventBus.emit(EventTypes.RACE_LAP_COMPLETE, {
        playerId: kartId,
        lapNumber: this.getCurrentLap(kartId),
        lapTime: this.getLapTime(kartId),
        totalTime: this.getTotalTime(kartId),
        bestLap: this.isBestLap(kartId)
      });
    }
  }
}

// HUD listens for race events
class HUD {
  constructor() {
    eventBus.on(EventTypes.RACE_LAP_COMPLETE, this.onLapComplete.bind(this));
    eventBus.on(EventTypes.RACE_POSITION, this.onPositionUpdate.bind(this));
  }

  private onLapComplete(event: GameEvent): void {
    const lapData = event.data as LapCompleteEvent['data'];
    this.updateLapDisplay(lapData.lapNumber);
    this.updateTimeDisplay(lapData.totalTime);
    
    if (lapData.bestLap) {
      this.showBestLapMessage();
    }
  }
}
```

### Audio System Events

```typescript
// AudioManager listens for audio events
class AudioManager {
  constructor() {
    eventBus.on(EventTypes.AUDIO_PLAY, this.onPlayAudio.bind(this));
    eventBus.on(EventTypes.RACE_LAP_COMPLETE, this.onLapComplete.bind(this));
    eventBus.on(EventTypes.PHYSICS_COLLISION, this.onCollision.bind(this));
  }

  private onPlayAudio(event: GameEvent): void {
    const audioData = event.data as PlayAudioEvent['data'];
    this.playSound(audioData.soundId, audioData.volume, audioData.position);
  }

  private onLapComplete(event: GameEvent): void {
    this.playSound('lap_complete', 0.8);
  }

  private onCollision(event: GameEvent): void {
    const collision = event.data as CollisionEvent['data'];
    if (collision.force > 100) {
      this.playSound('crash', Math.min(collision.force / 500, 1.0));
    }
  }
}
```

## System Integration Patterns

### System Base Class

```typescript
// Base class for all game systems
abstract class GameSystem {
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

  // Clean up when system is destroyed
  destroy(): void {
    // Systems should track their listeners and remove them
    this.eventBus.removeAllListeners();
  }
}
```

### Physics System Integration

```typescript
class PhysicsSystem extends GameSystem {
  registerEventListeners(): void {
    this.eventBus.on(EventTypes.ENTITY_SPAWN, this.onEntitySpawn.bind(this));
    this.eventBus.on(EventTypes.ENTITY_DESTROY, this.onEntityDestroy.bind(this));
  }

  update(deltaTime: number): void {
    if (!this.enabled) return;
    
    this.world.step(1/60, deltaTime);
    
    // Emit collision events
    for (const contact of this.world.contacts) {
      this.eventBus.emit(EventTypes.PHYSICS_COLLISION, {
        bodyA: contact.bi.userData?.entityId,
        bodyB: contact.bj.userData?.entityId,
        force: contact.getImpactVelocityAlongNormal(),
        point: contact.getContactPoint()
      });
    }
  }
}
```

## Best Practices

### Event Naming

Use consistent naming conventions:
- `system:action` format (e.g., `input:accelerate`, `race:start`)
- Past tense for completed actions (e.g., `race:lapComplete`)
- Present tense for ongoing actions (e.g., `input:steer`)

### Data Structure

Always include relevant data in events:

```typescript
// Good - includes all relevant data
eventBus.emit(EventTypes.ITEM_PICKUP, {
  playerId: 'player1',
  itemType: 'speedBoost',
  itemId: 'item_123',
  position: { x: 10, y: 0, z: 5 }
});

// Bad - missing important context
eventBus.emit(EventTypes.ITEM_PICKUP, { itemType: 'speedBoost' });
```

### Error Handling

Always handle potential errors in listeners:

```typescript
eventBus.on(EventTypes.PHYSICS_COLLISION, (event) => {
  try {
    const collision = event.data as CollisionEvent['data'];
    this.processCollision(collision);
  } catch (error) {
    console.error('Error processing collision:', error);
    // Don't re-throw - let other listeners continue
  }
});
```

### Memory Management

Prevent memory leaks by cleaning up listeners:

```typescript
class MySystem {
  private unsubscribeFunctions: Array<() => void> = [];

  constructor() {
    this.unsubscribeFunctions.push(
      eventBus.on(EventTypes.INPUT_ACCELERATE, this.onAccelerate.bind(this)),
      eventBus.on(EventTypes.INPUT_BRAKE, this.onBrake.bind(this))
    );
  }

  destroy(): void {
    this.unsubscribeFunctions.forEach(unsub => unsub());
    this.unsubscribeFunctions = [];
  }
}
```

### Performance Considerations

- Use `once()` for events that should only happen once
- Avoid heavy computation in event listeners
- Use event data efficiently - don't include unnecessary information
- Monitor performance with built-in tools

## Debugging and Monitoring

### Enable Logging

```typescript
const eventBus = new EventBus({ enableLogging: true });

// Or toggle at runtime
eventBus.setLogging(true);
```

### Performance Monitoring

```typescript
// Get current statistics
const stats = eventBus.getStats();
console.log(`Total events: ${stats.totalEvents}`);
console.log(`Total listeners: ${stats.totalListeners}`);

// Check event history
const history = eventBus.getEventHistory();
console.log('Recent events:', history);

// Check listener counts
const eventTypes = eventBus.getEventTypes();
for (const [type, count] of eventTypes) {
  console.log(`${type}: ${count} listeners`);
}
```

### Common Issues

1. **Memory Leaks**: Always unsubscribe when objects are destroyed
2. **Circular Dependencies**: Avoid systems emitting events they also listen to
3. **Event Flooding**: Be careful with high-frequency events (physics steps, input)
4. **Type Safety**: Use typed event constants from `EventTypes`

## Testing

### Unit Testing Events

```typescript
describe('KartSystem', () => {
  let kartSystem: KartSystem;
  let mockEventBus: EventBus;

  beforeEach(() => {
    mockEventBus = new EventBus();
    kartSystem = new KartSystem(mockEventBus);
  });

  it('should respond to accelerate input', () => {
    const spy = jest.spyOn(kartSystem, 'setThrottle');
    
    mockEventBus.emit(EventTypes.INPUT_ACCELERATE, { intensity: 0.8 });
    
    expect(spy).toHaveBeenCalledWith(0.8);
  });
});
```

### Integration Testing

```typescript
describe('Race Integration', () => {
  it('should complete lap workflow', () => {
    const eventBus = new EventBus();
    const raceManager = new RaceManager(eventBus);
    const hud = new HUD(eventBus);
    
    const hudSpy = jest.spyOn(hud, 'updateLapDisplay');
    
    // Simulate race events
    eventBus.emit(EventTypes.RACE_START);
    eventBus.emit(EventTypes.RACE_CHECKPOINT, {
      playerId: 'player1',
      checkpointId: 'finish',
      checkpointNumber: 0,
      timeStamp: performance.now()
    });
    
    expect(hudSpy).toHaveBeenCalled();
  });
});
```

## Configuration Options

```typescript
const eventBus = new EventBus({
  enableLogging: false,              // Log all events and listeners
  enablePerformanceMonitoring: true, // Track slow listeners
  maxListenersPerEvent: 50,          // Warn when limit exceeded
  enableEventHistory: true,          // Keep event history for debugging
  eventHistoryLimit: 100             // Max events to keep in history
});
```

This EventBus system provides the foundation for all inter-system communication in Business Cat Racing, enabling clean, maintainable, and scalable architecture.