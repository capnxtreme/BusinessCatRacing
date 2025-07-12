// Unit tests for Game class (without WebGL initialization)

import { Game } from '@/game/Game';
import { GameState } from '@/types/game.types';
import type { GameConfig } from '@/types/game.types';

describe('Game Unit Tests', () => {
  let container: HTMLElement;
  let config: GameConfig;

  beforeEach(() => {
    container = document.createElement('div');
    config = {
      targetFPS: 60,
      enablePhysicsDebug: false,
      enablePerformanceMonitoring: false,
      maxPlayers: 8,
    };
  });

  it('should create game instance with correct initial state', () => {
    const game = new Game(container, config);
    
    expect(game).toBeDefined();
    expect(game.getGameState()).toBe(GameState.LOADING);
  });

  it('should provide initial performance metrics', () => {
    const game = new Game(container, config);
    const metrics = game.getPerformanceMetrics();
    
    expect(metrics).toHaveProperty('fps');
    expect(metrics).toHaveProperty('frameTime');
    expect(metrics).toHaveProperty('memoryUsage');
    expect(metrics).toHaveProperty('renderCalls');
    
    expect(typeof metrics.fps).toBe('number');
    expect(typeof metrics.frameTime).toBe('number');
    expect(typeof metrics.memoryUsage).toBe('number');
    expect(typeof metrics.renderCalls).toBe('number');
  });

  it('should handle game state transitions correctly when not initialized', () => {
    const game = new Game(container, config);
    
    // Should start in loading state
    expect(game.getGameState()).toBe(GameState.LOADING);
    
    // Starting without initialization should not crash
    expect(() => game.start()).not.toThrow();
    
    // Should be able to stop
    expect(() => game.stop()).not.toThrow();
    expect(game.getGameState()).toBe(GameState.PAUSED);
  });
});