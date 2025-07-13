/**
 * EventBus Test Suite
 * 
 * Comprehensive test coverage for the core EventBus system
 */

import { EventBus } from '../../../src/core/EventBus';
import { EventTypes } from '../../../src/types/events.types';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus({
      enableLogging: false,
      enablePerformanceMonitoring: true,
      enableEventHistory: true,
      eventHistoryLimit: 10
    });
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe('Basic Event Handling', () => {
    it('should allow subscribing to events', () => {
      const listener = jest.fn();
      const unsubscribe = eventBus.on('test:event', listener);

      expect(typeof unsubscribe).toBe('function');
      expect(eventBus.hasListeners('test:event')).toBe(true);
      expect(eventBus.getListenerCount('test:event')).toBe(1);
    });

    it('should emit events to all subscribers', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const testData = { message: 'hello' };

      eventBus.on('test:event', listener1);
      eventBus.on('test:event', listener2);

      eventBus.emit('test:event', testData);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      const call1 = listener1.mock.calls[0][0];
      const call2 = listener2.mock.calls[0][0];

      expect(call1.type).toBe('test:event');
      expect(call1.data).toEqual(testData);
      expect(call1.timestamp).toBeGreaterThan(0);

      expect(call2.type).toBe('test:event');
      expect(call2.data).toEqual(testData);
    });

    it('should allow unsubscribing from events', () => {
      const listener = jest.fn();
      const unsubscribe = eventBus.on('test:event', listener);

      eventBus.emit('test:event', 'first');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      eventBus.emit('test:event', 'second');
      expect(listener).toHaveBeenCalledTimes(1);

      expect(eventBus.hasListeners('test:event')).toBe(false);
    });

    it('should handle events with no listeners gracefully', () => {
      expect(() => {
        eventBus.emit('nonexistent:event', 'data');
      }).not.toThrow();
    });

    it('should handle events with undefined data', () => {
      const listener = jest.fn();
      eventBus.on('test:event', listener);

      eventBus.emit('test:event');

      expect(listener).toHaveBeenCalledTimes(1);
      const call = listener.mock.calls[0][0];
      expect(call.data).toBeUndefined();
    });
  });

  describe('Once Listeners', () => {
    it('should call once listeners only once', () => {
      const listener = jest.fn();
      eventBus.once('test:event', listener);

      eventBus.emit('test:event', 'first');
      eventBus.emit('test:event', 'second');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(eventBus.hasListeners('test:event')).toBe(false);
    });

    it('should allow unsubscribing once listeners before they fire', () => {
      const listener = jest.fn();
      const unsubscribe = eventBus.once('test:event', listener);

      unsubscribe();
      eventBus.emit('test:event', 'data');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle mixed regular and once listeners', () => {
      const regularListener = jest.fn();
      const onceListener = jest.fn();

      eventBus.on('test:event', regularListener);
      eventBus.once('test:event', onceListener);

      eventBus.emit('test:event', 'first');
      expect(regularListener).toHaveBeenCalledTimes(1);
      expect(onceListener).toHaveBeenCalledTimes(1);

      eventBus.emit('test:event', 'second');
      expect(regularListener).toHaveBeenCalledTimes(2);
      expect(onceListener).toHaveBeenCalledTimes(1);

      expect(eventBus.getListenerCount('test:event')).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should isolate errors in event listeners', () => {
      const goodListener = jest.fn();
      const badListener = jest.fn(() => {
        throw new Error('Test error');
      });
      const anotherGoodListener = jest.fn();

      eventBus.on('test:event', goodListener);
      eventBus.on('test:event', badListener);
      eventBus.on('test:event', anotherGoodListener);

      // Should not throw despite bad listener
      expect(() => {
        eventBus.emit('test:event', 'data');
      }).not.toThrow();

      // Good listeners should still be called
      expect(goodListener).toHaveBeenCalledTimes(1);
      expect(anotherGoodListener).toHaveBeenCalledTimes(1);
      expect(badListener).toHaveBeenCalledTimes(1);
    });

    it('should validate event types', () => {
      expect(() => {
        eventBus.on('', jest.fn());
      }).toThrow('Event type must be a non-empty string');

      expect(() => {
        eventBus.on(123 as any, jest.fn());
      }).toThrow('Event type must be a non-empty string');

      expect(() => {
        eventBus.emit('');
      }).toThrow('Event type must be a non-empty string');
    });

    it('should validate listeners', () => {
      expect(() => {
        eventBus.on('test:event', 'not a function' as any);
      }).toThrow('Listener must be a function');

      expect(() => {
        eventBus.on('test:event', null as any);
      }).toThrow('Listener must be a function');
    });
  });

  describe('Event Statistics', () => {
    it('should track event statistics', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventBus.on('test:event1', listener1);
      eventBus.on('test:event1', listener2);
      eventBus.on('test:event2', listener1);

      eventBus.emit('test:event1', 'data1');
      eventBus.emit('test:event1', 'data2');
      eventBus.emit('test:event2', 'data3');

      const stats = eventBus.getStats();

      expect(stats.totalEvents).toBe(3);
      expect(stats.totalListeners).toBe(3);
      expect(stats.eventTypesCounts.get('test:event1')).toBe(2);
      expect(stats.eventTypesCounts.get('test:event2')).toBe(1);
      expect(stats.averageListenersPerEvent).toBeCloseTo(1.5);
      expect(stats.lastEventTime).toBeGreaterThan(0);
    });

    it('should track event types and counts', () => {
      eventBus.on('test:event1', jest.fn());
      eventBus.on('test:event1', jest.fn());
      eventBus.on('test:event2', jest.fn());

      const eventTypes = eventBus.getEventTypes();

      expect(eventTypes.get('test:event1')).toBe(2);
      expect(eventTypes.get('test:event2')).toBe(1);
      expect(eventTypes.size).toBe(2);
    });
  });

  describe('Event History', () => {
    it('should maintain event history when enabled', () => {
      eventBus.emit('test:event1', 'data1');
      eventBus.emit('test:event2', 'data2');

      const history = eventBus.getEventHistory();

      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('test:event1');
      expect(history[0].data).toBe('data1');
      expect(history[1].type).toBe('test:event2');
      expect(history[1].data).toBe('data2');
    });

    it('should limit event history size', () => {
      const limitedBus = new EventBus({ eventHistoryLimit: 3 });

      // Emit more events than the limit
      for (let i = 0; i < 5; i++) {
        limitedBus.emit('test:event', `data${i}`);
      }

      const history = limitedBus.getEventHistory();

      expect(history).toHaveLength(3);
      expect(history[0].data).toBe('data2'); // Oldest kept
      expect(history[2].data).toBe('data4'); // Newest
    });

    it('should allow clearing event history', () => {
      eventBus.emit('test:event', 'data');
      expect(eventBus.getEventHistory()).toHaveLength(1);

      eventBus.clearHistory();
      expect(eventBus.getEventHistory()).toHaveLength(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should warn about slow listeners', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const slowListener = jest.fn(() => {
        // Simulate slow operation
        const start = performance.now();
        while (performance.now() - start < 20) {
          // Busy wait for 20ms
        }
      });

      eventBus.on('test:event', slowListener);
      eventBus.emit('test:event', 'data');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow listener for \'test:event\'')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Memory Management', () => {
    it('should clean up empty listener arrays', () => {
      const listener = jest.fn();
      const unsubscribe = eventBus.on('test:event', listener);

      expect(eventBus.hasListeners('test:event')).toBe(true);

      unsubscribe();

      expect(eventBus.hasListeners('test:event')).toBe(false);
      expect(eventBus.getEventTypes().has('test:event')).toBe(false);
    });

    it('should remove all listeners for specific event type', () => {
      eventBus.on('test:event1', jest.fn());
      eventBus.on('test:event1', jest.fn());
      eventBus.on('test:event2', jest.fn());

      expect(eventBus.getListenerCount('test:event1')).toBe(2);
      expect(eventBus.getListenerCount('test:event2')).toBe(1);

      eventBus.removeAllListeners('test:event1');

      expect(eventBus.getListenerCount('test:event1')).toBe(0);
      expect(eventBus.getListenerCount('test:event2')).toBe(1);
    });

    it('should remove all listeners for all events', () => {
      eventBus.on('test:event1', jest.fn());
      eventBus.on('test:event2', jest.fn());

      expect(eventBus.getStats().totalListeners).toBe(2);

      eventBus.removeAllListeners();

      expect(eventBus.getStats().totalListeners).toBe(0);
      expect(eventBus.getEventTypes().size).toBe(0);
    });

    it('should warn when max listeners limit is reached', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const limitedBus = new EventBus({ maxListenersPerEvent: 2 });

      limitedBus.on('test:event', jest.fn());
      limitedBus.on('test:event', jest.fn());
      limitedBus.on('test:event', jest.fn()); // This should trigger warning

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Maximum listeners (2) reached')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should respect logging configuration', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const loggingBus = new EventBus({ enableLogging: true });

      loggingBus.on('test:event', jest.fn());
      loggingBus.emit('test:event', 'data');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Listener added for \'test:event\'')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Emitted \'test:event\' to 1 listeners')
      );

      consoleSpy.mockRestore();
    });

    it('should allow toggling logging at runtime', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      eventBus.setLogging(true);
      eventBus.on('test:event', jest.fn());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockClear();

      eventBus.setLogging(false);
      eventBus.on('test:event2', jest.fn());

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Type Safety with Game Events', () => {
    it('should work with typed events', () => {
      const listener = jest.fn();
      
      eventBus.on(EventTypes.INPUT_ACCELERATE, listener);
      eventBus.emit(EventTypes.INPUT_ACCELERATE, { intensity: 0.8 });

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0];
      expect(event.type).toBe('input:accelerate');
      expect(event.data.intensity).toBe(0.8);
    });

    it('should handle race events correctly', () => {
      const listener = jest.fn();
      
      eventBus.on(EventTypes.RACE_LAP_COMPLETE, listener);
      eventBus.emit(EventTypes.RACE_LAP_COMPLETE, {
        playerId: 'player1',
        lapNumber: 2,
        lapTime: 45.5,
        totalTime: 120.3,
        bestLap: true
      });

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0];
      expect(event.data.playerId).toBe('player1');
      expect(event.data.bestLap).toBe(true);
    });
  });

  describe('Source Tracking', () => {
    it('should track event sources', () => {
      const listener = jest.fn();
      
      eventBus.on('test:event', listener, 'TestSystem');
      eventBus.emit('test:event', 'data', 'SomeOtherSystem');

      const event = listener.mock.calls[0][0];
      expect(event.source).toBe('SomeOtherSystem');
    });
  });
});