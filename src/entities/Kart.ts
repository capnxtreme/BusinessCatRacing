// Kart entity implementation with physics and visual components

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { KartConfig, KartState, KartControls, KartPerformanceMetrics } from '@/types/kart.types';
import type { PhysicsWorld } from '@/engine/PhysicsWorld';

export class Kart {
  private config: KartConfig;
  private state!: KartState;
  private controls!: KartControls;
  
  // Visual components
  private group!: THREE.Group;
  private bodyMesh!: THREE.Mesh;
  private wheels: THREE.Mesh[] = [];
  private characterMesh?: THREE.Mesh;
  
  // Physics components
  private physicsBody!: CANNON.Body;
  // Physics components (future implementation)
  // private wheelBodies: CANNON.Body[] = [];
  // private constraints: CANNON.Constraint[] = [];
  
  // Performance tracking
  private performanceMetrics!: KartPerformanceMetrics;
  
  // Internal state
  private engineForce: number = 0;
  private steerValue: number = 0;

  constructor(config: KartConfig, physics: PhysicsWorld) {
    this.config = config;
    this.initializeState();
    this.initializeControls();
    this.initializeVisuals();
    this.initializePhysics(physics);
    this.calculatePerformanceMetrics();
  }

  private initializeState(): void {
    this.state = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      speed: 0,
      steering: 0,
      acceleration: 0,
      isGrounded: false,
      isDrifting: false,
      driftLevel: 0,
      engineRPM: 1000,
    };
  }

  private initializeControls(): void {
    this.controls = {
      accelerate: 0,
      brake: 0,
      steering: 0,
      drift: false,
      useItem: false,
      lookBehind: false,
    };
  }

  private initializeVisuals(): void {
    this.group = new THREE.Group();
    
    // Create kart body
    this.createKartBody();
    
    // Create wheels
    this.createWheels();
    
    // Create character placeholder
    this.createCharacterPlaceholder();
  }

  private createKartBody(): void {
    // Simple kart body - box with rounded edges
    const bodyGeometry = new THREE.BoxGeometry(
      this.config.visual.kartScale.x,
      this.config.visual.kartScale.y,
      this.config.visual.kartScale.z
    );
    
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: this.config.visual.bodyColor,
    });
    
    this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.bodyMesh.position.y = 0.3; // Raise body above ground
    
    this.group.add(this.bodyMesh);
  }

  private createWheels(): void {
    const wheelGeometry = new THREE.CylinderGeometry(
      this.config.visual.wheelSize,
      this.config.visual.wheelSize,
      0.3,
      16
    );
    
    const wheelMaterial = new THREE.MeshLambertMaterial({
      color: this.config.visual.wheelColor,
    });

    // Wheel positions (relative to kart body)
    const wheelPositions = [
      { x: -0.8, y: 0, z: 1.2 },  // Front left
      { x: 0.8, y: 0, z: 1.2 },   // Front right
      { x: -0.8, y: 0, z: -1.2 }, // Rear left
      { x: 0.8, y: 0, z: -1.2 },  // Rear right
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2; // Rotate to face forward
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      
      this.wheels.push(wheel);
      this.group.add(wheel);
    });
  }

  private createCharacterPlaceholder(): void {
    // Simple character placeholder - will be replaced with actual character later
    const characterGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const characterMaterial = new THREE.MeshLambertMaterial({
      color: 0x333333, // Dark gray placeholder
    });
    
    this.characterMesh = new THREE.Mesh(characterGeometry, characterMaterial);
    this.characterMesh.position.set(0, 0.8, 0.2); // Sitting position
    this.characterMesh.castShadow = true;
    
    this.group.add(this.characterMesh);
  }

  private initializePhysics(physics: PhysicsWorld): void {
    // Create main kart body
    const bodyShape = new CANNON.Box(new CANNON.Vec3(
      this.config.visual.kartScale.x / 2,
      this.config.visual.kartScale.y / 2,
      this.config.visual.kartScale.z / 2
    ));
    
    this.physicsBody = new CANNON.Body({
      mass: this.config.physics.mass,
      shape: bodyShape,
    });
    
    this.physicsBody.position.set(0, 1, 0);
    this.physicsBody.material = new CANNON.Material('kart');
    
    // Add to physics world
    physics.addBody('kart_body', this.physicsBody, this.group, 'kart');
  }

  public update(deltaTime: number): void {
    this.updatePhysics(deltaTime);
    this.updateState();
    this.updateVisuals();
    this.updateWheelRotation(deltaTime);
  }

  private updatePhysics(_deltaTime: number): void {
    // Apply engine force
    if (this.controls.accelerate > 0) {
      this.engineForce = this.config.physics.enginePower * this.controls.accelerate;
    } else {
      this.engineForce = 0;
    }

    // Apply brake force (future implementation)

    // Apply steering
    this.steerValue = this.controls.steering * this.config.physics.maxSteerAngle;

    // Calculate forces
    const forwardForce = new CANNON.Vec3(0, 0, this.engineForce);
    const localForward = new CANNON.Vec3(0, 0, 1);
    this.physicsBody.quaternion.vmult(localForward, localForward);
    
    // Apply forward force
    if (this.engineForce > 0) {
      localForward.scale(this.engineForce, forwardForce);
      this.physicsBody.applyForce(forwardForce);
      console.log('Applying force:', this.engineForce, 'Direction:', localForward);
    }

    // Apply steering torque
    if (Math.abs(this.steerValue) > 0.01 && this.state.speed > 0.5) {
      const torque = new CANNON.Vec3(0, this.steerValue * this.state.speed * 100, 0);
      this.physicsBody.applyTorque(torque);
    }

    // Apply drag
    const drag = this.physicsBody.velocity.clone();
    drag.scale(-this.config.physics.dragCoefficient);
    this.physicsBody.applyForce(drag);

    // Apply angular drag
    const angularDrag = this.physicsBody.angularVelocity.clone();
    angularDrag.scale(-0.1);
    this.physicsBody.applyTorque(angularDrag);
  }

  private updateState(): void {
    // Update position and rotation from physics
    this.state.position = {
      x: this.physicsBody.position.x,
      y: this.physicsBody.position.y,
      z: this.physicsBody.position.z,
    };

    // Convert quaternion to Euler angles
    const quaternion = this.physicsBody.quaternion;
    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
    );
    
    this.state.rotation = {
      x: euler.x,
      y: euler.y,
      z: euler.z,
    };

    // Update velocity
    this.state.velocity = {
      x: this.physicsBody.velocity.x,
      y: this.physicsBody.velocity.y,
      z: this.physicsBody.velocity.z,
    };

    // Calculate speed
    this.state.speed = Math.sqrt(
      this.state.velocity.x ** 2 +
      this.state.velocity.y ** 2 +
      this.state.velocity.z ** 2
    );

    // Update other state values
    this.state.steering = this.steerValue;
    this.state.acceleration = this.engineForce / this.config.physics.mass;
    this.state.isGrounded = this.checkGroundContact();
    this.state.engineRPM = this.calculateEngineRPM();
  }

  private updateVisuals(): void {
    // Sync visual group with physics body
    this.group.position.copy(this.physicsBody.position as any);
    this.group.quaternion.copy(this.physicsBody.quaternion as any);
  }

  private updateWheelRotation(deltaTime: number): void {
    // Rotate wheels based on speed
    const wheelRotation = (this.state.speed / this.config.visual.wheelSize) * deltaTime;
    
    this.wheels.forEach((wheel, index) => {
      wheel.rotation.x += wheelRotation;
      
      // Steer front wheels
      if (index < 2) { // Front wheels
        wheel.rotation.y = this.steerValue;
      }
    });
  }

  private checkGroundContact(): boolean {
    // Simple ground check - in a real implementation, this would use raycasting
    return this.physicsBody.position.y < 2.0;
  }

  private calculateEngineRPM(): number {
    const baseRPM = 1000;
    const maxRPM = 8000;
    const speedRatio = this.state.speed / 30; // Assuming max speed of 30 m/s
    return Math.min(baseRPM + (speedRatio * (maxRPM - baseRPM)), maxRPM);
  }

  private calculatePerformanceMetrics(): void {
    this.performanceMetrics = {
      topSpeed: this.config.physics.enginePower / this.config.physics.dragCoefficient,
      acceleration0to60: (60 * 1000) / (this.config.physics.enginePower / this.config.physics.mass),
      brakingDistance: 50, // Simplified calculation
      turningRadius: 5 / Math.tan(this.config.physics.maxSteerAngle),
      driftThreshold: 15, // Speed threshold for drifting
    };
  }

  // Public API methods
  public setControls(controls: Partial<KartControls>): void {
    Object.assign(this.controls, controls);
  }

  public getState(): KartState {
    return { ...this.state };
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public getPhysicsBody(): CANNON.Body {
    return this.physicsBody;
  }

  public getPerformanceMetrics(): KartPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  public setPosition(position: { x: number; y: number; z: number }): void {
    this.physicsBody.position.set(position.x, position.y, position.z);
    this.physicsBody.velocity.set(0, 0, 0);
    this.physicsBody.angularVelocity.set(0, 0, 0);
  }

  public resetKart(): void {
    this.setPosition({ x: 0, y: 2, z: 0 });
    this.physicsBody.quaternion.set(0, 0, 0, 1);
    this.initializeControls();
  }

  public dispose(): void {
    // Clean up visual components
    this.group.clear();
    
    // Physics cleanup would be handled by PhysicsWorld
    console.log('Kart disposed');
  }
}