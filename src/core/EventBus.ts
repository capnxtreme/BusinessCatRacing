/**
 * EventBus - Core event-driven communication system
 * 
 * Provides loose coupling between game systems by allowing 
 * publish-subscribe messaging without direct dependencies.
 */

/**
 * Base interface for all game events
 */
export interface GameEvent {
  readonly type: string;
  readonly data?: unknown;
  readonly timestamp: number;
  readonly source?: string;
}

/**
 * Event listener function signature
 */
export type EventListener = (event: GameEvent) => void;

/**
 * Event listener with metadata for debugging and management
 */
interface ListenerInfo {
  listener: EventListener;
  once: boolean;
  source?: string;
}

/**
 * EventBus statistics for monitoring and debugging
 */
export interface EventBusStats {
  totalEvents: number;
  totalListeners: number;
  eventTypesCounts: Map<string, number>;
  averageListenersPerEvent: number;
  lastEventTime: number;
}

/**
 * EventBus configuration options
 */
export interface EventBusConfig {
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
  maxListenersPerEvent: number;
  enableEventHistory: boolean;
  eventHistoryLimit: number;
}

/**
 * Core EventBus implementation
 * 
 * Features:
 * - Type-safe event handling
 * - Performance monitoring
 * - Error isolation
 * - Event history for debugging
 * - Memory leak prevention
 */
export class EventBus {
  private listeners: Map<string, ListenerInfo[]> = new Map();
  private stats: EventBusStats;
  private eventHistory: GameEvent[] = [];
  private config: EventBusConfig;
  
  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = {
      enableLogging: false,
      enablePerformanceMonitoring: true,
      maxListenersPerEvent: 50,
      enableEventHistory: true,
      eventHistoryLimit: 100,
      ...config
    };
    
    this.stats = {
      totalEvents: 0,
      totalListeners: 0,
      eventTypesCounts: new Map(),
      averageListenersPerEvent: 0,
      lastEventTime: 0
    };
  }

  /**
   * Subscribe to events of a specific type
   */
  public on(
    eventType: string,
    listener: EventListener,
    source?: string
  ): () => void {
    this.validateEventType(eventType);
    this.validateListener(listener);
    
    const listenerInfo: ListenerInfo = {
      listener: listener as EventListener,
      once: false,
      source
    };
    
    this.addListener(eventType, listenerInfo);
    
    if (this.config.enableLogging) {
      console.log(`[EventBus] Listener added for '${eventType}' from ${source || 'unknown'}`);
    }
    
    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  /**
   * Subscribe to an event type, but only listen once
   */
  public once(
    eventType: string,
    listener: EventListener,
    source?: string
  ): () => void {
    this.validateEventType(eventType);
    this.validateListener(listener);
    
    const listenerInfo: ListenerInfo = {
      listener: listener as EventListener,
      once: true,
      source
    };
    
    this.addListener(eventType, listenerInfo);
    
    if (this.config.enableLogging) {
      console.log(`[EventBus] One-time listener added for '${eventType}' from ${source || 'unknown'}`);
    }
    
    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  /**
   * Unsubscribe from events
   */
  public off(eventType: string, listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return;
    
    const index = listeners.findIndex(info => info.listener === listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.updateStats();
      
      if (this.config.enableLogging) {
        console.log(`[EventBus] Listener removed for '${eventType}'`);
      }
      
      // Clean up empty listener arrays
      if (listeners.length === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit an event to all subscribed listeners
   */
  public emit(eventType: string, data?: unknown, source?: string): void {
    this.validateEventType(eventType);
    
    const event: GameEvent = {
      type: eventType,
      data,
      timestamp: performance.now(),
      source
    };
    
    this.recordEvent(event);
    
    const listeners = this.listeners.get(eventType);
    if (!listeners || listeners.length === 0) {
      if (this.config.enableLogging) {
        console.log(`[EventBus] No listeners for event '${eventType}'`);
      }
      return;
    }
    
    // Process listeners, handling errors and "once" cleanup
    const listenersToRemove: number[] = [];
    
    for (let i = 0; i < listeners.length; i++) {
      const listenerInfo = listeners[i];
      
      try {
        if (this.config.enablePerformanceMonitoring) {
          const start = performance.now();
          listenerInfo.listener(event as GameEvent);
          const duration = performance.now() - start;
          
          if (duration > 16) { // Warn if listener takes longer than 1 frame
            console.warn(`[EventBus] Slow listener for '${eventType}': ${duration.toFixed(2)}ms`);
          }
        } else {
          listenerInfo.listener(event as GameEvent);
        }
        
        // Mark once-listeners for removal
        if (listenerInfo.once) {
          listenersToRemove.push(i);
        }
        
      } catch (error) {
        console.error(`[EventBus] Error in listener for '${eventType}':`, error);
        // Continue processing other listeners despite errors
      }
    }
    
    // Remove once-listeners (in reverse order to maintain indices)
    for (let i = listenersToRemove.length - 1; i >= 0; i--) {
      listeners.splice(listenersToRemove[i], 1);
    }
    
    if (this.config.enableLogging) {
      console.log(`[EventBus] Emitted '${eventType}' to ${listeners.length} listeners`);
    }
  }

  /**
   * Remove all listeners for a specific event type
   */
  public removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
      if (this.config.enableLogging) {
        console.log(`[EventBus] Removed all listeners for '${eventType}'`);
      }
    } else {
      this.listeners.clear();
      if (this.config.enableLogging) {
        console.log(`[EventBus] Removed all listeners`);
      }
    }
    this.updateStats();
  }

  /**
   * Get current event bus statistics
   */
  public getStats(): EventBusStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get recent event history (if enabled)
   */
  public getEventHistory(): GameEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Get list of current event types with listener counts
   */
  public getEventTypes(): Map<string, number> {
    const eventTypes = new Map<string, number>();
    for (const [eventType, listeners] of this.listeners) {
      eventTypes.set(eventType, listeners.length);
    }
    return eventTypes;
  }

  /**
   * Check if there are listeners for a specific event type
   */
  public hasListeners(eventType: string): boolean {
    const listeners = this.listeners.get(eventType);
    return listeners !== undefined && listeners.length > 0;
  }

  /**
   * Get number of listeners for a specific event type
   */
  public getListenerCount(eventType: string): number {
    const listeners = this.listeners.get(eventType);
    return listeners ? listeners.length : 0;
  }

  /**
   * Enable or disable logging
   */
  public setLogging(enabled: boolean): void {
    this.config.enableLogging = enabled;
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  // Private helper methods

  private addListener(eventType: string, listenerInfo: ListenerInfo): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    const listeners = this.listeners.get(eventType)!;
    
    // Check for max listeners limit
    if (listeners.length >= this.config.maxListenersPerEvent) {
      console.warn(`[EventBus] Maximum listeners (${this.config.maxListenersPerEvent}) reached for '${eventType}'`);
    }
    
    listeners.push(listenerInfo);
    this.updateStats();
  }

  private recordEvent(event: GameEvent): void {
    this.stats.totalEvents++;
    this.stats.lastEventTime = event.timestamp;
    
    // Update event type counts
    const currentCount = this.stats.eventTypesCounts.get(event.type) || 0;
    this.stats.eventTypesCounts.set(event.type, currentCount + 1);
    
    // Add to history if enabled
    if (this.config.enableEventHistory) {
      this.eventHistory.push(event);
      
      // Trim history if it exceeds limit
      if (this.eventHistory.length > this.config.eventHistoryLimit) {
        this.eventHistory.shift();
      }
    }
  }

  private updateStats(): void {
    this.stats.totalListeners = Array.from(this.listeners.values())
      .reduce((total, listeners) => total + listeners.length, 0);
    
    this.stats.averageListenersPerEvent = this.listeners.size > 0 
      ? this.stats.totalListeners / this.listeners.size 
      : 0;
  }

  private validateEventType(eventType: string): void {
    if (!eventType || typeof eventType !== 'string') {
      throw new Error('[EventBus] Event type must be a non-empty string');
    }
  }

  private validateListener(listener: EventListener): void {
    if (typeof listener !== 'function') {
      throw new Error('[EventBus] Listener must be a function');
    }
  }
}

/**
 * Global EventBus instance
 * Can be used throughout the application for system-wide events
 */
export const globalEventBus = new EventBus({
  enableLogging: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: true,
  enableEventHistory: process.env.NODE_ENV === 'development'
});