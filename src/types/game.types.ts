// Core game type definitions for Business Cat Racing

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface GameConfig {
  targetFPS: number;
  enablePhysicsDebug: boolean;
  enablePerformanceMonitoring: boolean;
  maxPlayers: number;
}

export enum GameState {
  MENU = 'menu',
  LOADING = 'loading',
  RACING = 'racing',
  PAUSED = 'paused',
  FINISHED = 'finished',
  ERROR = 'error',
}

export interface InputState {
  accelerate: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  drift: boolean;
  useItem: boolean;
  lookBehind: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCalls: number;
}

export interface GameEvents {
  stateChange: GameState;
  raceStart: void;
  raceFinish: { position: number; time: number };
  lapComplete: { lap: number; time: number };
  itemPickup: { itemType: string };
  collision: { target: string; force: number };
}