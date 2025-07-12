// Physics system type definitions

import type * as CANNON from 'cannon-es';

export interface PhysicsConfig {
  gravity: number;
  solverIterations: number;
  enableDebugRenderer: boolean;
  fixedTimeStep: number;
  maxSubSteps: number;
}

export interface KartPhysicsConfig {
  mass: number;
  enginePower: number;
  maxSteerAngle: number;
  wheelRadius: number;
  wheelFriction: number;
  rollResistance: number;
  suspensionStiffness: number;
  suspensionDamping: number;
  suspensionCompression: number;
  dragCoefficient: number;
  downforceCoefficient: number;
  centerOfMassHeight: number;
  trackWidth: number;
  wheelbase: number;
}

export interface PhysicsBody {
  body: CANNON.Body;
  mesh?: THREE.Mesh;
  type: 'kart' | 'track' | 'item' | 'static';
}

export interface CollisionEvent {
  bodyA: CANNON.Body;
  bodyB: CANNON.Body;
  contact: CANNON.ContactEquation;
  impulse: number;
}