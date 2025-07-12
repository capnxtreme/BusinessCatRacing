// Kart and vehicle type definitions

import type { Vector3D } from './game.types';
import type { KartPhysicsConfig } from './physics.types';
import type { CharacterType } from './character.types';

export interface KartConfig {
  physics: KartPhysicsConfig;
  visual: KartVisualConfig;
  character: CharacterType;
  customization: KartCustomization;
}

export interface KartVisualConfig {
  bodyColor: string;
  bodyMaterial: string;
  wheelColor: string;
  wheelSize: number;
  kartScale: Vector3D;
  characterScale: Vector3D;
}

export interface KartCustomization {
  bodyColor: string;
  wheelType: 'standard' | 'racing' | 'offroad' | 'luxury';
  accessories: string[];
  decals: string[];
  spoilerType?: 'none' | 'small' | 'large' | 'racing';
}

export interface KartState {
  position: Vector3D;
  rotation: Vector3D;
  velocity: Vector3D;
  angularVelocity: Vector3D;
  speed: number;
  steering: number;
  acceleration: number;
  isGrounded: boolean;
  isDrifting: boolean;
  driftLevel: number;
  engineRPM: number;
}

export interface KartControls {
  accelerate: number;    // 0-1
  brake: number;         // 0-1
  steering: number;      // -1 to 1
  drift: boolean;
  useItem: boolean;
  lookBehind: boolean;
}

export interface WheelConfig {
  radius: number;
  width: number;
  mass: number;
  friction: number;
  suspensionStiffness: number;
  suspensionDamping: number;
  suspensionRestLength: number;
  maxSuspensionTravel: number;
}

export interface KartPerformanceMetrics {
  topSpeed: number;
  acceleration0to60: number;
  brakingDistance: number;
  turningRadius: number;
  driftThreshold: number;
}