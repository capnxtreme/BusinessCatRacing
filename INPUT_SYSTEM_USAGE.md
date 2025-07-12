# Business Cat Racing - Input System Usage Guide

## Overview

The input system provides a comprehensive, configurable, and testable way to handle keyboard input in Business Cat Racing. It's designed to be completely independent of other game systems while providing clean integration points.

## Files Created

### Core Implementation
- `/src/types/input.types.ts` - Type definitions and interfaces
- `/src/game/InputManager.ts` - Main input management class
- `/tests/unit/inputManager.test.ts` - Comprehensive unit tests

### Modified Files
- `/src/types/game.types.ts` - Updated to reference InputState from input.types.ts

## Basic Usage

### 1. Initialize the Input Manager

```typescript
import { InputManager } from '@/game/InputManager';
import { InputContext } from '@/types/input.types';

// Create with default configuration
const inputManager = new InputManager();

// Or with custom configuration
const inputManager = new InputManager({
  preventDefault: true,
  enableDebugLogging: false,
  trackInputEvents: true,
  maxEventHistory: 100,
});

// Initialize event listeners
inputManager.initialize();
```

### 2. Set Input Context

```typescript
// Set context based on game state
inputManager.setContext(InputContext.MENU);    // For menus
inputManager.setContext(InputContext.RACING);  // For racing
inputManager.setContext(InputContext.PAUSED);  // For pause screens
inputManager.setContext(InputContext.LOADING); // For loading screens
```

### 3. Check Input State

```typescript
// In your game loop
function update(deltaTime: number) {
  inputManager.update(deltaTime);
  
  const inputState = inputManager.getInputState();
  
  if (inputState.accelerate) {
    // Handle acceleration
    vehicle.accelerate(deltaTime);
  }
  
  if (inputState.brake) {
    // Handle braking
    vehicle.brake(deltaTime);
  }
  
  if (inputState.steerLeft) {
    // Handle left steering
    vehicle.steer(-1, deltaTime);
  }
  
  if (inputState.steerRight) {
    // Handle right steering
    vehicle.steer(1, deltaTime);
  }
  
  // Check specific actions
  if (inputManager.isActionActive('drift')) {
    vehicle.enableDrift();
  }
}
```

### 4. Integration with Game Class

```typescript
// In your Game class
export class Game {
  private inputManager: InputManager;
  
  constructor(container: HTMLElement, config: GameConfig) {
    // ... existing initialization
    this.inputManager = new InputManager({
      enableDebugLogging: config.enablePhysicsDebug,
      trackInputEvents: config.enablePerformanceMonitoring,
    });
  }
  
  public async initialize(): Promise<void> {
    // ... existing initialization
    this.inputManager.initialize();
  }
  
  private gameLoop(): void {
    // ... existing game loop
    this.inputManager.update(deltaTime);
    
    // Pass input state to other systems
    const inputState = this.inputManager.getInputState();
    this.updateVehicle(inputState, deltaTime);
  }
  
  public dispose(): void {
    // ... existing cleanup
    this.inputManager.dispose();
  }
}
```

## Advanced Features

### Custom Key Mapping

```typescript
// Update key mappings
inputManager.updateKeyMapping({
  accelerate: ['KeyI'], // Change from WASD to IJKL
  brake: ['KeyK'],
  steerLeft: ['KeyJ'],
  steerRight: ['KeyL'],
});

// Get current mapping
const mapping = inputManager.getKeyMapping();
console.log('Accelerate keys:', mapping.accelerate);
```

### Event History and Analytics

```typescript
// Enable event tracking
const inputManager = new InputManager({
  trackInputEvents: true,
  maxEventHistory: 200,
});

// Get event history for analytics
const events = inputManager.getEventHistory();
events.forEach(event => {
  console.log(`Event: ${event.type}, Key: ${event.key}, Time: ${event.timestamp}`);
});

// Clear history
inputManager.clearEventHistory();
```

### Manual Input Triggers (Testing)

```typescript
// Useful for testing or AI input
inputManager.setContext(InputContext.RACING);
inputManager.triggerAction('accelerate', true);
inputManager.triggerAction('steerLeft', true);

// Later...
inputManager.triggerAction('accelerate', false);
inputManager.triggerAction('steerLeft', false);
```

### Enable/Disable Input

```typescript
// Disable input processing (useful for cutscenes, dialogs)
inputManager.setEnabled(false);

// Re-enable
inputManager.setEnabled(true);

// Check state
if (inputManager.isInputEnabled()) {
  // Process input-dependent logic
}
```

## Available Input Actions

### Vehicle Controls (Racing Context)
- `accelerate` - Forward acceleration (W, ↑)
- `brake` - Braking/reverse (S, ↓)
- `steerLeft` - Left steering (A, ←)
- `steerRight` - Right steering (D, →)
- `drift` - Drift mode (Space, Shift)
- `useItem` - Use picked up item (E, Enter)
- `lookBehind` - Rear view (C)

### Game Controls
- `pause` - Pause/unpause (Escape, P)
- `cameraToggle` - Switch camera view (V)
- `cameraReset` - Reset camera (R)

### Menu/UI Controls (Menu Context)
- `confirm` - Confirm selection (Enter, Space)
- `cancel` - Cancel/back (Escape, Backspace)
- `menuUp` - Navigate up (W, ↑)
- `menuDown` - Navigate down (S, ↓)
- `menuLeft` - Navigate left (A, ←)
- `menuRight` - Navigate right (D, →)

### Debug Controls (Development)
- `debugToggle` - Toggle debug info (F3)
- `resetVehicle` - Reset vehicle position (F5)

## Context-Aware Input

The input system automatically filters available actions based on the current context:

- **MENU**: Only menu navigation and debug actions work
- **RACING**: All vehicle controls, camera, and game controls work
- **PAUSED**: Pause, menu navigation, and debug actions work
- **LOADING**: Only cancel and debug actions work

## Testing

The system includes comprehensive unit tests covering:

- Input state management
- Context switching
- Key mapping updates
- Event history tracking
- Enable/disable functionality
- Error handling
- Event listener management

Run tests with:
```bash
npm test -- inputManager.test.ts
```

## Configuration Options

```typescript
interface InputManagerConfig {
  keyMapping?: Partial<KeyMapping>;     // Custom key overrides
  preventDefault: boolean;              // Prevent browser defaults
  enableDebugLogging: boolean;         // Console debug output
  trackInputEvents: boolean;           // Store event history
  maxEventHistory: number;             // Max events to keep
}
```

## Best Practices

1. **Always set the correct input context** when game state changes
2. **Call `update()` every frame** for proper input processing
3. **Use `dispose()` for cleanup** to prevent memory leaks
4. **Disable input during cutscenes** to prevent unwanted actions
5. **Check `isInputEnabled()`** before processing input-dependent logic
6. **Use the event history** for analytics and debugging

## Future Enhancements

The system is designed to support future enhancements:

- Analog input values for smoother steering/acceleration
- Gamepad/controller support
- Input recording and playback
- Input remapping UI
- Gesture recognition
- Custom input sensitivity curves

## Architecture Benefits

- **Independent**: Works without other game systems
- **Testable**: Comprehensive unit test coverage
- **Configurable**: Flexible key mapping and settings
- **Context-aware**: Automatic input filtering based on game state
- **Extensible**: Easy to add new actions and input sources
- **Performance-focused**: Minimal overhead with efficient event handling