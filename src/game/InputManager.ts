// Input management system for Business Cat Racing

import type {
  InputState,
  KeyMapping,
  InputEvent,
  InputManagerConfig,
  ContextualInputMapping,
  InputSensitivity,
} from '@/types/input.types';
import {
  DEFAULT_KEY_MAPPING,
  DEFAULT_INPUT_CONFIG,
  DEFAULT_CONTEXTUAL_MAPPING,
  DEFAULT_INPUT_SENSITIVITY,
  InputEventType,
  InputContext,
} from '@/types/input.types';

/**
 * Manages all input handling for the game including keyboard events,
 * input state tracking, key mapping, and context-aware input processing
 */
export class InputManager {
  private inputState: InputState;
  private keyMapping: KeyMapping;
  private config: InputManagerConfig;
  private contextualMapping: ContextualInputMapping;
  // @ts-ignore - Reserved for future analog input implementation
  private sensitivity: InputSensitivity;
  
  private currentContext: InputContext = InputContext.MENU;
  private isEnabled: boolean = true;
  private eventHistory: InputEvent[] = [];
  
  // Internal tracking
  private pressedKeys: Set<string> = new Set();
  private keyToActionMap: Map<string, (keyof InputState)[]> = new Map();
  
  // Event listeners for cleanup
  private boundKeyDownHandler: (event: KeyboardEvent) => void;
  private boundKeyUpHandler: (event: KeyboardEvent) => void;
  private boundBlurHandler: () => void;
  private boundFocusHandler: () => void;

  constructor(config: Partial<InputManagerConfig> = {}) {
    this.config = { ...DEFAULT_INPUT_CONFIG, ...config };
    this.keyMapping = { ...DEFAULT_KEY_MAPPING, ...config.keyMapping };
    this.contextualMapping = DEFAULT_CONTEXTUAL_MAPPING;
    this.sensitivity = DEFAULT_INPUT_SENSITIVITY;
    
    // Initialize input state
    this.inputState = this.createEmptyInputState();
    
    // Bind event handlers
    this.boundKeyDownHandler = this.handleKeyDown.bind(this);
    this.boundKeyUpHandler = this.handleKeyUp.bind(this);
    this.boundBlurHandler = this.handleFocusLost.bind(this);
    this.boundFocusHandler = this.handleFocusGained.bind(this);
    
    // Build key-to-action mapping
    this.buildKeyToActionMap();
    
    this.logDebug('InputManager initialized');
  }

  /**
   * Initialize the input manager and start listening for events
   */
  public initialize(): void {
    if (typeof window === 'undefined') {
      console.warn('InputManager: Window not available, skipping event listener setup');
      return;
    }

    // Add event listeners
    window.addEventListener('keydown', this.boundKeyDownHandler);
    window.addEventListener('keyup', this.boundKeyUpHandler);
    window.addEventListener('blur', this.boundBlurHandler);
    window.addEventListener('focus', this.boundFocusHandler);
    
    this.logDebug('InputManager event listeners attached');
  }

  /**
   * Dispose of the input manager and clean up event listeners
   */
  public dispose(): void {
    if (typeof window === 'undefined') return;

    // Remove event listeners
    window.removeEventListener('keydown', this.boundKeyDownHandler);
    window.removeEventListener('keyup', this.boundKeyUpHandler);
    window.removeEventListener('blur', this.boundBlurHandler);
    window.removeEventListener('focus', this.boundFocusHandler);
    
    // Clear state
    this.pressedKeys.clear();
    this.eventHistory = [];
    this.inputState = this.createEmptyInputState();
    
    this.logDebug('InputManager disposed');
  }

  /**
   * Update the input manager (should be called each frame)
   * This handles smooth input transitions and contextual input processing
   */
  public update(deltaTime: number = 0.016): void {
    if (!this.isEnabled) return;

    // Process smooth input transitions for analog-like behavior
    this.updateSmoothInputs(deltaTime);
    
    // Clean up old event history
    this.cleanupEventHistory();
  }

  /**
   * Get the current input state
   */
  public getInputState(): Readonly<InputState> {
    return { ...this.inputState };
  }

  /**
   * Check if a specific action is currently active
   */
  public isActionActive(action: keyof InputState): boolean {
    return this.inputState[action];
  }

  /**
   * Check if any key is currently pressed
   */
  public isAnyKeyPressed(): boolean {
    return this.pressedKeys.size > 0;
  }

  /**
   * Get the list of currently pressed keys
   */
  public getPressedKeys(): string[] {
    return Array.from(this.pressedKeys);
  }

  /**
   * Set the current input context (affects which inputs are processed)
   */
  public setContext(context: InputContext): void {
    if (this.currentContext !== context) {
      this.logDebug(`Input context changed from ${this.currentContext} to ${context}`);
      this.currentContext = context;
      
      // Clear state when switching contexts to prevent stuck inputs
      this.clearInputState();
    }
  }

  /**
   * Get the current input context
   */
  public getContext(): InputContext {
    return this.currentContext;
  }

  /**
   * Enable or disable input processing
   */
  public setEnabled(enabled: boolean): void {
    if (this.isEnabled !== enabled) {
      this.isEnabled = enabled;
      this.logDebug(`InputManager ${enabled ? 'enabled' : 'disabled'}`);
      
      if (!enabled) {
        this.clearInputState();
      }
    }
  }

  /**
   * Check if input processing is enabled
   */
  public isInputEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Update key mapping configuration
   */
  public updateKeyMapping(newMapping: Partial<KeyMapping>): void {
    this.keyMapping = { ...this.keyMapping, ...newMapping };
    this.buildKeyToActionMap();
    this.logDebug('Key mapping updated');
  }

  /**
   * Get the current key mapping
   */
  public getKeyMapping(): Readonly<KeyMapping> {
    return { ...this.keyMapping };
  }

  /**
   * Get input event history (useful for debugging and analytics)
   */
  public getEventHistory(): Readonly<InputEvent[]> {
    return [...this.eventHistory];
  }

  /**
   * Clear input event history
   */
  public clearEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Manually trigger an action (useful for testing or external input sources)
   */
  public triggerAction(action: keyof InputState, active: boolean): void {
    if (!this.isEnabled) return;
    
    if (this.isActionAllowedInCurrentContext(action)) {
      this.inputState[action] = active;
      this.logDebug(`Manually triggered action: ${action} = ${active}`);
    }
  }

  /**
   * Handle keyboard key down events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const keyCode = event.code;
    
    // Prevent key repeat
    if (this.pressedKeys.has(keyCode)) return;
    
    this.pressedKeys.add(keyCode);
    
    // Get actions mapped to this key
    const actions = this.keyToActionMap.get(keyCode) || [];
    
    // Process each action
    let actionTriggered = false;
    for (const action of actions) {
      if (this.isActionAllowedInCurrentContext(action)) {
        this.inputState[action] = true;
        actionTriggered = true;
        this.logDebug(`Key down: ${keyCode} -> ${action}`);
      }
    }
    
    // Prevent default browser behavior if configured and action was triggered
    if (this.config.preventDefault && actionTriggered) {
      event.preventDefault();
    }
    
    // Track event if enabled
    if (this.config.trackInputEvents) {
      this.addToEventHistory({
        type: InputEventType.KEY_DOWN,
        key: keyCode,
        timestamp: performance.now(),
      });
    }
  }

  /**
   * Handle keyboard key up events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const keyCode = event.code;
    this.pressedKeys.delete(keyCode);
    
    // Get actions mapped to this key
    const actions = this.keyToActionMap.get(keyCode) || [];
    
    // Process each action
    for (const action of actions) {
      if (this.isActionAllowedInCurrentContext(action)) {
        this.inputState[action] = false;
        this.logDebug(`Key up: ${keyCode} -> ${action}`);
      }
    }
    
    // Track event if enabled
    if (this.config.trackInputEvents) {
      this.addToEventHistory({
        type: InputEventType.KEY_UP,
        key: keyCode,
        timestamp: performance.now(),
      });
    }
  }

  /**
   * Handle window focus lost event
   */
  private handleFocusLost(): void {
    this.logDebug('Window focus lost, clearing input state');
    this.clearInputState();
    
    if (this.config.trackInputEvents) {
      this.addToEventHistory({
        type: InputEventType.FOCUS_LOST,
        timestamp: performance.now(),
      });
    }
  }

  /**
   * Handle window focus gained event
   */
  private handleFocusGained(): void {
    this.logDebug('Window focus gained');
    
    if (this.config.trackInputEvents) {
      this.addToEventHistory({
        type: InputEventType.FOCUS_GAINED,
        timestamp: performance.now(),
      });
    }
  }

  /**
   * Build the mapping from keys to actions for efficient lookup
   */
  private buildKeyToActionMap(): void {
    this.keyToActionMap.clear();
    
    for (const [action, keys] of Object.entries(this.keyMapping)) {
      for (const key of keys) {
        if (!this.keyToActionMap.has(key)) {
          this.keyToActionMap.set(key, []);
        }
        this.keyToActionMap.get(key)!.push(action as keyof InputState);
      }
    }
    
    this.logDebug(`Built key-to-action map with ${this.keyToActionMap.size} key mappings`);
  }

  /**
   * Check if an action is allowed in the current input context
   */
  private isActionAllowedInCurrentContext(action: keyof InputState): boolean {
    return this.contextualMapping[this.currentContext].includes(action);
  }

  /**
   * Create an empty input state with all actions set to false
   */
  private createEmptyInputState(): InputState {
    return {
      accelerate: false,
      brake: false,
      steerLeft: false,
      steerRight: false,
      drift: false,
      useItem: false,
      lookBehind: false,
      pause: false,
      confirm: false,
      cancel: false,
      menuUp: false,
      menuDown: false,
      menuLeft: false,
      menuRight: false,
      cameraToggle: false,
      cameraReset: false,
      debugToggle: false,
      resetVehicle: false,
    };
  }

  /**
   * Clear all input state
   */
  private clearInputState(): void {
    this.inputState = this.createEmptyInputState();
    this.pressedKeys.clear();
  }

  /**
   * Update smooth input transitions for analog-like behavior
   */
  private updateSmoothInputs(_deltaTime: number = 0.016): void {
    // This method is reserved for future implementation of smooth input transitions
    // that would provide analog-like behavior for digital inputs (keyboard)
    // For now, inputs are binary (on/off), but this could be enhanced to provide
    // gradual ramping for steering and acceleration
  }

  /**
   * Add an event to the history buffer
   */
  private addToEventHistory(event: InputEvent): void {
    this.eventHistory.push(event);
    
    // Keep history within bounds
    if (this.eventHistory.length > this.config.maxEventHistory) {
      this.eventHistory = this.eventHistory.slice(-this.config.maxEventHistory);
    }
  }

  /**
   * Clean up old events from history based on age
   */
  private cleanupEventHistory(): void {
    if (!this.config.trackInputEvents || this.eventHistory.length === 0) return;
    
    const now = performance.now();
    const maxAge = 30000; // 30 seconds
    
    this.eventHistory = this.eventHistory.filter(event => 
      now - event.timestamp < maxAge
    );
  }

  /**
   * Debug logging helper
   */
  private logDebug(message: string): void {
    if (this.config.enableDebugLogging) {
      console.log(`[InputManager] ${message}`);
    }
  }
}