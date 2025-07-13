/**
 * Game Event Type Definitions
 * 
 * Centralized definition of all event types used throughout the game.
 * This ensures type safety and prevents typos in event names.
 */

import type { GameEvent } from '../core/EventBus';

// =============================================================================
// Core System Events
// =============================================================================

export interface SystemEvent extends GameEvent {
  type: 'system:init' | 'system:shutdown' | 'system:error' | 'system:ready';
}

export interface SystemErrorEvent extends SystemEvent {
  type: 'system:error';
  data: {
    system: string;
    error: Error;
    recoverable: boolean;
  };
}

// =============================================================================
// Input Events
// =============================================================================

export interface InputEvent extends GameEvent {
  type: 'input:accelerate' | 'input:brake' | 'input:steer' | 'input:drift' | 'input:item' | 'input:camera' | 'input:pause';
}

export interface SteerEvent extends InputEvent {
  type: 'input:steer';
  data: {
    direction: number; // -1 to 1
    intensity: number; // 0 to 1
  };
}

export interface AccelerateEvent extends InputEvent {
  type: 'input:accelerate';
  data: {
    intensity: number; // 0 to 1
  };
}

export interface BrakeEvent extends InputEvent {
  type: 'input:brake';
  data: {
    intensity: number; // 0 to 1
  };
}

// =============================================================================
// Physics Events
// =============================================================================

export interface PhysicsEvent extends GameEvent {
  type: 'physics:collision' | 'physics:step' | 'physics:bodyAdded' | 'physics:bodyRemoved';
}

export interface CollisionEvent extends PhysicsEvent {
  type: 'physics:collision';
  data: {
    bodyA: string; // Entity ID
    bodyB: string; // Entity ID
    force: number;
    point: { x: number; y: number; z: number };
  };
}

// =============================================================================
// Race Events
// =============================================================================

export interface RaceEvent extends GameEvent {
  type: 'race:start' | 'race:finish' | 'race:lapComplete' | 'race:checkpoint' | 'race:wrongWay' | 'race:position';
}

export interface LapCompleteEvent extends RaceEvent {
  type: 'race:lapComplete';
  data: {
    playerId: string;
    lapNumber: number;
    lapTime: number;
    totalTime: number;
    bestLap: boolean;
  };
}

export interface CheckpointEvent extends RaceEvent {
  type: 'race:checkpoint';
  data: {
    playerId: string;
    checkpointId: string;
    checkpointNumber: number;
    timeStamp: number;
  };
}

export interface PositionUpdateEvent extends RaceEvent {
  type: 'race:position';
  data: {
    playerId: string;
    position: number;
    totalPlayers: number;
    distanceFromLeader: number;
  };
}

// =============================================================================
// Item Events
// =============================================================================

export interface ItemEvent extends GameEvent {
  type: 'item:pickup' | 'item:use' | 'item:spawn' | 'item:effect';
}

export interface ItemPickupEvent extends ItemEvent {
  type: 'item:pickup';
  data: {
    playerId: string;
    itemType: string;
    itemId: string;
    position: { x: number; y: number; z: number };
  };
}

export interface ItemUseEvent extends ItemEvent {
  type: 'item:use';
  data: {
    playerId: string;
    itemType: string;
    targetId?: string;
    effectDuration?: number;
  };
}

// =============================================================================
// Audio Events
// =============================================================================

export interface AudioEvent extends GameEvent {
  type: 'audio:play' | 'audio:stop' | 'audio:volumeChange' | 'audio:musicChange';
}

export interface PlayAudioEvent extends AudioEvent {
  type: 'audio:play';
  data: {
    soundId: string;
    volume?: number;
    loop?: boolean;
    position?: { x: number; y: number; z: number };
    fadeIn?: number;
  };
}

export interface StopAudioEvent extends AudioEvent {
  type: 'audio:stop';
  data: {
    soundId: string;
    fadeOut?: number;
  };
}

// =============================================================================
// UI Events
// =============================================================================

export interface UIEvent extends GameEvent {
  type: 'ui:show' | 'ui:hide' | 'ui:update' | 'ui:click' | 'ui:hover';
}

export interface UIUpdateEvent extends UIEvent {
  type: 'ui:update';
  data: {
    component: string;
    values: Record<string, unknown>;
  };
}

// =============================================================================
// Camera Events
// =============================================================================

export interface CameraEvent extends GameEvent {
  type: 'camera:change' | 'camera:follow' | 'camera:shake' | 'camera:reset';
}

export interface CameraChangeEvent extends CameraEvent {
  type: 'camera:change';
  data: {
    newMode: string;
    transition: boolean;
    duration?: number;
  };
}

export interface CameraShakeEvent extends CameraEvent {
  type: 'camera:shake';
  data: {
    intensity: number;
    duration: number;
    falloff?: number;
  };
}

// =============================================================================
// Performance Events
// =============================================================================

export interface PerformanceEvent extends GameEvent {
  type: 'performance:stats' | 'performance:warning' | 'performance:optimization';
}

export interface PerformanceStatsEvent extends PerformanceEvent {
  type: 'performance:stats';
  data: {
    fps: number;
    frameTime: number;
    memoryUsage?: number;
    drawCalls?: number;
    triangles?: number;
  };
}

export interface PerformanceWarningEvent extends PerformanceEvent {
  type: 'performance:warning';
  data: {
    metric: string;
    value: number;
    threshold: number;
    suggestion?: string;
  };
}

// =============================================================================
// Game State Events
// =============================================================================

export interface GameStateEvent extends GameEvent {
  type: 'gamestate:change' | 'gamestate:pause' | 'gamestate:resume' | 'gamestate:restart';
}

export interface GameStateChangeEvent extends GameStateEvent {
  type: 'gamestate:change';
  data: {
    from: string;
    to: string;
    reason?: string;
  };
}

// =============================================================================
// Entity Events
// =============================================================================

export interface EntityEvent extends GameEvent {
  type: 'entity:spawn' | 'entity:destroy' | 'entity:update' | 'entity:component';
}

export interface EntitySpawnEvent extends EntityEvent {
  type: 'entity:spawn';
  data: {
    entityId: string;
    entityType: string;
    position: { x: number; y: number; z: number };
    components: string[];
  };
}

export interface EntityDestroyEvent extends EntityEvent {
  type: 'entity:destroy';
  data: {
    entityId: string;
    reason?: string;
  };
}

// =============================================================================
// Event Type Union
// =============================================================================

export type AllGameEvents = 
  | SystemEvent
  | InputEvent
  | PhysicsEvent
  | RaceEvent
  | ItemEvent
  | AudioEvent
  | UIEvent
  | CameraEvent
  | PerformanceEvent
  | GameStateEvent
  | EntityEvent;

// =============================================================================
// Event Constants
// =============================================================================

export const EventTypes = {
  // System
  SYSTEM_INIT: 'system:init' as const,
  SYSTEM_SHUTDOWN: 'system:shutdown' as const,
  SYSTEM_ERROR: 'system:error' as const,
  SYSTEM_READY: 'system:ready' as const,

  // Input
  INPUT_ACCELERATE: 'input:accelerate' as const,
  INPUT_BRAKE: 'input:brake' as const,
  INPUT_STEER: 'input:steer' as const,
  INPUT_DRIFT: 'input:drift' as const,
  INPUT_ITEM: 'input:item' as const,
  INPUT_CAMERA: 'input:camera' as const,
  INPUT_PAUSE: 'input:pause' as const,

  // Physics
  PHYSICS_COLLISION: 'physics:collision' as const,
  PHYSICS_STEP: 'physics:step' as const,
  PHYSICS_BODY_ADDED: 'physics:bodyAdded' as const,
  PHYSICS_BODY_REMOVED: 'physics:bodyRemoved' as const,

  // Race
  RACE_START: 'race:start' as const,
  RACE_FINISH: 'race:finish' as const,
  RACE_LAP_COMPLETE: 'race:lapComplete' as const,
  RACE_CHECKPOINT: 'race:checkpoint' as const,
  RACE_WRONG_WAY: 'race:wrongWay' as const,
  RACE_POSITION: 'race:position' as const,

  // Items
  ITEM_PICKUP: 'item:pickup' as const,
  ITEM_USE: 'item:use' as const,
  ITEM_SPAWN: 'item:spawn' as const,
  ITEM_EFFECT: 'item:effect' as const,

  // Audio
  AUDIO_PLAY: 'audio:play' as const,
  AUDIO_STOP: 'audio:stop' as const,
  AUDIO_VOLUME_CHANGE: 'audio:volumeChange' as const,
  AUDIO_MUSIC_CHANGE: 'audio:musicChange' as const,

  // UI
  UI_SHOW: 'ui:show' as const,
  UI_HIDE: 'ui:hide' as const,
  UI_UPDATE: 'ui:update' as const,
  UI_CLICK: 'ui:click' as const,
  UI_HOVER: 'ui:hover' as const,

  // Camera
  CAMERA_CHANGE: 'camera:change' as const,
  CAMERA_FOLLOW: 'camera:follow' as const,
  CAMERA_SHAKE: 'camera:shake' as const,
  CAMERA_RESET: 'camera:reset' as const,

  // Performance
  PERFORMANCE_STATS: 'performance:stats' as const,
  PERFORMANCE_WARNING: 'performance:warning' as const,
  PERFORMANCE_OPTIMIZATION: 'performance:optimization' as const,

  // Game State
  GAMESTATE_CHANGE: 'gamestate:change' as const,
  GAMESTATE_PAUSE: 'gamestate:pause' as const,
  GAMESTATE_RESUME: 'gamestate:resume' as const,
  GAMESTATE_RESTART: 'gamestate:restart' as const,

  // Entity
  ENTITY_SPAWN: 'entity:spawn' as const,
  ENTITY_DESTROY: 'entity:destroy' as const,
  ENTITY_UPDATE: 'entity:update' as const,
  ENTITY_COMPONENT: 'entity:component' as const,
} as const;