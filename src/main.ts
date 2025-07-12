// Main entry point for Business Cat Racing

import { Game } from '@/game/Game';
import type { GameConfig } from '@/types/game.types';

const gameConfig: GameConfig = {
  targetFPS: 60,
  enablePhysicsDebug: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: true,
  maxPlayers: 8,
};

async function initializeGame(): Promise<void> {
  try {
    // Get game container
    const container = document.getElementById('game-container');
    if (!container) {
      throw new Error('Game container not found');
    }

    // Remove loading message
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.remove();
    }

    // Initialize game
    const game = new Game(container, gameConfig);
    await game.initialize();
    
    console.log('Business Cat Racing initialized successfully');
    
    // Start the game
    game.start();
    
  } catch (error) {
    console.error('Failed to initialize Business Cat Racing:', error);
    
    // Show error message to user
    const container = document.getElementById('game-container');
    if (container) {
      container.innerHTML = `
        <div style="color: red; text-align: center;">
          <h2>Failed to load Business Cat Racing</h2>
          <p>Please refresh the page and try again.</p>
          <p style="font-size: 12px; margin-top: 20px;">Error: ${error}</p>
        </div>
      `;
    }
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}