// Camera system type definitions for Business Cat Racing

import * as THREE from 'three';
import type { Vector3D } from './game.types';

export enum CameraMode {
  FOLLOW = 'follow',
  FREE = 'free',
  CINEMATIC = 'cinematic',
  OVERHEAD = 'overhead',
  SIDE = 'side',
  COCKPIT = 'cockpit',
}

export enum CameraFollowType {
  BEHIND = 'behind',
  CHASE = 'chase',
  ORBIT = 'orbit',
  SIDE_VIEW = 'side_view',
  OVERHEAD_VIEW = 'overhead_view',
  FRONT_VIEW = 'front_view',
}


export interface CameraOffset {
  position: Vector3D;
  rotation: Vector3D;
}

export interface CameraConfig {
  mode: CameraMode;
  followType: CameraFollowType;
  offset: CameraOffset;
  smoothing: {
    position: number; // lerp factor for position smoothing (0-1)
    rotation: number; // slerp factor for rotation smoothing (0-1)
    lookAt: number;   // smoothing factor for look-at target
  };
  constraints: {
    minDistance: number;
    maxDistance: number;
    minHeight: number;
    maxHeight: number;
    enableCollisionDetection: boolean;
  };
  fov: number;
  near: number;
  far: number;
}

export interface CameraTarget {
  object3D: THREE.Object3D;
  velocity?: THREE.Vector3;
  priority: number; // for multi-target scenarios
  isActive: boolean;
}

export interface CameraShakeConfig {
  intensity: number;
  duration: number; // in milliseconds
  frequency: number; // Hz
  decay: number; // how quickly shake diminishes (0-1)
}

export interface CameraState {
  mode: CameraMode;
  currentTarget: CameraTarget | null;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  lookAtTarget: THREE.Vector3;
  isTransitioning: boolean;
  transitionProgress: number; // 0-1
  shake: {
    isActive: boolean;
    timeRemaining: number;
    currentIntensity: number;
    offset: THREE.Vector3;
  };
}

export interface CameraTransition {
  fromConfig: CameraConfig;
  toConfig: CameraConfig;
  duration: number; // in milliseconds
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  onComplete?: () => void;
}

export interface CameraBounds {
  min: Vector3D;
  max: Vector3D;
  collisionMeshes?: THREE.Mesh[];
}

export interface CameraEvents {
  modeChanged: { from: CameraMode; to: CameraMode };
  targetChanged: { from: CameraTarget | null; to: CameraTarget | null };
  transitionStarted: { transition: CameraTransition };
  transitionCompleted: { transition: CameraTransition };
  shakeStarted: { config: CameraShakeConfig };
  shakeEnded: void;
  collisionDetected: { position: Vector3D; normal: Vector3D };
}

// Predefined camera configurations for common scenarios
export interface CameraPresets {
  kartRacing: {
    chase: CameraConfig;
    cockpit: CameraConfig;
    overhead: CameraConfig;
    cinematic: CameraConfig;
  };
  debug: {
    free: CameraConfig;
    overview: CameraConfig;
  };
}

// Configuration for camera interpolation and smoothing
export interface CameraSmoothingConfig {
  positionDamping: number;
  rotationDamping: number;
  lookAtDamping: number;
  velocityInfluence: number; // how much target velocity affects camera positioning
  anticipation: number; // how far ahead to look based on velocity
}

// Camera collision detection configuration
export interface CameraCollisionConfig {
  enabled: boolean;
  raycastDistance: number;
  collisionLayers: string[]; // physics collision layers to check against
  minDistanceFromSurface: number;
  smoothingOnCollision: number;
}