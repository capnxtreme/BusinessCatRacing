// Input system type definitions for Business Cat Racing

/**
 * Represents the current state of all game inputs
 */
export interface InputState {
  // Vehicle controls
  accelerate: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  drift: boolean;
  
  // Game controls
  useItem: boolean;
  lookBehind: boolean;
  pause: boolean;
  
  // Menu/UI controls
  confirm: boolean;
  cancel: boolean;
  menuUp: boolean;
  menuDown: boolean;
  menuLeft: boolean;
  menuRight: boolean;
  
  // Camera controls
  cameraToggle: boolean;
  cameraReset: boolean;
  
  // Debug controls (development only)
  debugToggle: boolean;
  resetVehicle: boolean;
}

/**
 * Maps keyboard keys to game actions
 */
export interface KeyMapping {
  // Vehicle controls
  accelerate: string[];
  brake: string[];
  steerLeft: string[];
  steerRight: string[];
  drift: string[];
  
  // Game controls
  useItem: string[];
  lookBehind: string[];
  pause: string[];
  
  // Menu/UI controls
  confirm: string[];
  cancel: string[];
  menuUp: string[];
  menuDown: string[];
  menuLeft: string[];
  menuRight: string[];
  
  // Camera controls
  cameraToggle: string[];
  cameraReset: string[];
  
  // Debug controls
  debugToggle: string[];
  resetVehicle: string[];
}

/**
 * Default key mapping configuration
 */
export const DEFAULT_KEY_MAPPING: KeyMapping = {
  // Vehicle controls - WASD and Arrow keys
  accelerate: ['KeyW', 'ArrowUp'],
  brake: ['KeyS', 'ArrowDown'],
  steerLeft: ['KeyA', 'ArrowLeft'],
  steerRight: ['KeyD', 'ArrowRight'],
  drift: ['Space', 'ShiftLeft', 'ShiftRight'],
  
  // Game controls
  useItem: ['KeyE', 'Enter'],
  lookBehind: ['KeyC'],
  pause: ['Escape', 'KeyP'],
  
  // Menu/UI controls
  confirm: ['Enter', 'Space'],
  cancel: ['Escape', 'Backspace'],
  menuUp: ['KeyW', 'ArrowUp'],
  menuDown: ['KeyS', 'ArrowDown'],
  menuLeft: ['KeyA', 'ArrowLeft'],
  menuRight: ['KeyD', 'ArrowRight'],
  
  // Camera controls
  cameraToggle: ['KeyV'],
  cameraReset: ['KeyR'],
  
  // Debug controls
  debugToggle: ['F3'],
  resetVehicle: ['F5'],
};

/**
 * Input event types for the input system
 */
export enum InputEventType {
  KEY_DOWN = 'keydown',
  KEY_UP = 'keyup',
  FOCUS_LOST = 'blur',
  FOCUS_GAINED = 'focus',
}

/**
 * Input event data structure
 */
export interface InputEvent {
  type: InputEventType;
  key?: string;
  action?: keyof InputState;
  timestamp: number;
}

/**
 * Configuration options for the InputManager
 */
export interface InputManagerConfig {
  /** Custom key mapping override */
  keyMapping?: Partial<KeyMapping>;
  
  /** Whether to prevent default browser behavior for mapped keys */
  preventDefault: boolean;
  
  /** Whether to enable debug logging */
  enableDebugLogging: boolean;
  
  /** Whether to track input events for analytics/debugging */
  trackInputEvents: boolean;
  
  /** Maximum number of input events to store in history */
  maxEventHistory: number;
}

/**
 * Default configuration for InputManager
 */
export const DEFAULT_INPUT_CONFIG: InputManagerConfig = {
  preventDefault: true,
  enableDebugLogging: false,
  trackInputEvents: false,
  maxEventHistory: 100,
};

/**
 * Input context enum to handle different game states
 */
export enum InputContext {
  MENU = 'menu',
  RACING = 'racing',
  PAUSED = 'paused',
  LOADING = 'loading',
}

/**
 * Context-specific input mapping
 */
export interface ContextualInputMapping {
  [InputContext.MENU]: (keyof InputState)[];
  [InputContext.RACING]: (keyof InputState)[];
  [InputContext.PAUSED]: (keyof InputState)[];
  [InputContext.LOADING]: (keyof InputState)[];
}

/**
 * Default contextual input mapping - defines which inputs are active in each game state
 */
export const DEFAULT_CONTEXTUAL_MAPPING: ContextualInputMapping = {
  [InputContext.MENU]: [
    'confirm', 'cancel', 'menuUp', 'menuDown', 'menuLeft', 'menuRight',
    'debugToggle'
  ],
  [InputContext.RACING]: [
    'accelerate', 'brake', 'steerLeft', 'steerRight', 'drift',
    'useItem', 'lookBehind', 'pause', 'cameraToggle', 'cameraReset',
    'debugToggle', 'resetVehicle'
  ],
  [InputContext.PAUSED]: [
    'pause', 'confirm', 'cancel', 'menuUp', 'menuDown', 'menuLeft', 'menuRight',
    'debugToggle'
  ],
  [InputContext.LOADING]: [
    'cancel', 'debugToggle'
  ],
};

/**
 * Input sensitivity settings for analog-like behavior on digital inputs
 */
export interface InputSensitivity {
  /** How quickly steering reaches maximum value (0-1) */
  steeringRampUp: number;
  
  /** How quickly steering returns to neutral (0-1) */
  steeringRampDown: number;
  
  /** How quickly acceleration reaches maximum value (0-1) */
  accelerationRampUp: number;
  
  /** How quickly acceleration returns to neutral (0-1) */
  accelerationRampDown: number;
}

/**
 * Default input sensitivity settings
 */
export const DEFAULT_INPUT_SENSITIVITY: InputSensitivity = {
  steeringRampUp: 0.8,
  steeringRampDown: 0.9,
  accelerationRampUp: 0.95,
  accelerationRampDown: 0.85,
};