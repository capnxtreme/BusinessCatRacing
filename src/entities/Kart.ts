// Kart entity implementation with physics and visual components

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { KartConfig, KartState, KartControls, KartPerformanceMetrics } from '@/types/kart.types';
import type { PhysicsWorld } from '@/engine/PhysicsWorld';
import { ParticleSystem } from '@/graphics/ParticleSystem';

export class Kart {
  private config: KartConfig;
  private state!: KartState;
  private controls!: KartControls;
  
  // Visual components
  private group!: THREE.Group;
  private wheels: THREE.Mesh[] = [];
  
  // Physics components
  private physicsBody!: CANNON.Body;
  // Physics components (future implementation)
  // private wheelBodies: CANNON.Body[] = [];
  // private constraints: CANNON.Constraint[] = [];
  
  // Performance tracking
  private performanceMetrics!: KartPerformanceMetrics;
  
  // Effects system
  private particleSystem?: ParticleSystem;
  
  // Internal state
  private engineForce: number = 0;
  private steerValue: number = 0;
  private lastParticleTime: number = 0;

  constructor(config: KartConfig, physics: PhysicsWorld, particleSystem?: ParticleSystem) {
    this.config = config;
    this.particleSystem = particleSystem;
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
    // Create a professional-looking racing kart
    const kartGroup = new THREE.Group();
    
    // Enhanced main chassis with better proportions
    const chassisGeometry = new THREE.BoxGeometry(1.6, 0.4, 2.4);
    // Create glossy racing material
    const chassisMaterial = new THREE.MeshPhongMaterial({
      color: this.config.visual.bodyColor,
      shininess: 100,
      specular: 0x222222,
    });
    
    const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
    chassis.position.y = 0.4;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    kartGroup.add(chassis);
    
    // Prominent front nose cone (makes direction clear)
    const noseGeometry = new THREE.ConeGeometry(0.3, 1.0, 8);
    const noseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff6600,  // Bright orange for visibility
      shininess: 80 
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.z = Math.PI / 2; // Point forward
    nose.position.set(0, 0.4, 2.0); // Further forward
    nose.castShadow = true;
    kartGroup.add(nose);
    
    // Front arrow indicator (makes direction super clear)
    const arrowGeometry = new THREE.ConeGeometry(0.15, 0.6, 3);
    const arrowMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 }); // Yellow arrow
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.rotation.z = Math.PI / 2;
    arrow.position.set(0, 0.8, 2.3); // High and forward
    arrow.castShadow = true;
    kartGroup.add(arrow);
    
    // Rear wing/spoiler (makes back obvious)
    const wingGeometry = new THREE.BoxGeometry(1.4, 0.15, 0.4);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x000000,  // Black spoiler
      shininess: 60 
    });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.set(0, 0.9, -1.4); // Higher and further back
    wing.castShadow = true;
    kartGroup.add(wing);
    
    // Side barriers/panels with racing stripes
    const panelGeometry = new THREE.BoxGeometry(0.08, 0.35, 1.8);
    const panelMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x222222,  // Dark side panels
      shininess: 40 
    });
    
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-0.85, 0.4, 0.1);
    leftPanel.castShadow = true;
    kartGroup.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(0.85, 0.4, 0.1);
    rightPanel.castShadow = true;
    kartGroup.add(rightPanel);
    
    // Racing stripes for style
    const stripeGeometry = new THREE.BoxGeometry(0.1, 0.02, 2.0);
    const stripeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
    const leftStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    leftStripe.position.set(-0.3, 0.65, 0.2);
    kartGroup.add(leftStripe);
    
    const rightStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    rightStripe.position.set(0.3, 0.65, 0.2);
    kartGroup.add(rightStripe);
    
    // Engine exhaust pipes (visual detail)
    const exhaustGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
    const exhaustMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x444444,
      shininess: 80 
    });
    
    const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    leftExhaust.position.set(-0.4, 0.3, -1.3);
    leftExhaust.rotation.z = Math.PI / 2;
    kartGroup.add(leftExhaust);
    
    const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    rightExhaust.position.set(0.4, 0.3, -1.3);
    rightExhaust.rotation.z = Math.PI / 2;
    kartGroup.add(rightExhaust);
    
    this.group.add(kartGroup);
  }

  private createWheels(): void {
    // Wheel positions (relative to kart body)
    const wheelPositions = [
      { x: -0.9, y: 0, z: 1.0 },  // Front left
      { x: 0.9, y: 0, z: 1.0 },   // Front right
      { x: -0.9, y: 0, z: -1.0 }, // Rear left
      { x: 0.9, y: 0, z: -1.0 },  // Rear right
    ];

    wheelPositions.forEach((pos, index) => {
      const isFrontWheel = index < 2; // First two wheels are front wheels
      const wheelGroup = this.createWheelAssembly(isFrontWheel);
      wheelGroup.position.set(pos.x, pos.y, pos.z);
      
      // Mirror left wheels
      if (pos.x < 0) {
        wheelGroup.rotation.y = Math.PI;
      }
      
      this.wheels.push(wheelGroup as any);
      this.group.add(wheelGroup);
    });
  }

  private createWheelAssembly(isFrontWheel: boolean = false): THREE.Group {
    const wheelGroup = new THREE.Group();
    
    // Tire (black rubber) - front wheels slightly larger
    const wheelSize = isFrontWheel ? this.config.visual.wheelSize * 1.1 : this.config.visual.wheelSize;
    const tireGeometry = new THREE.CylinderGeometry(
      wheelSize,
      wheelSize,
      0.28,
      16
    );
    const tireMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a, // Dark tire color
      shininess: 8,
    });
    
    const tire = new THREE.Mesh(tireGeometry, tireMaterial);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    tire.receiveShadow = true;
    wheelGroup.add(tire);
    
    // Rim/Hub (different colors for front/rear)
    const rimGeometry = new THREE.CylinderGeometry(
      wheelSize * 0.65,
      wheelSize * 0.65,
      0.18,
      12
    );
    const rimColor = isFrontWheel ? 0xffaa00 : 0x888888; // Gold front, silver rear
    const rimMaterial = new THREE.MeshPhongMaterial({
      color: rimColor,
      shininess: 120,
      specular: 0x444444,
    });
    
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.z = Math.PI / 2;
    rim.position.x = 0.05;
    rim.castShadow = true;
    wheelGroup.add(rim);
    
    // Front wheel indicator (red dot for clarity)
    if (isFrontWheel) {
      const indicatorGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const indicatorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,  // Bright red
        shininess: 100 
      });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(0.12, 0, 0);
      indicator.name = 'front-indicator';
      indicator.castShadow = true;
      wheelGroup.add(indicator);
    }
    
    // Brake disc (inner detail)
    const brakeGeometry = new THREE.CylinderGeometry(
      wheelSize * 0.45,
      wheelSize * 0.45,
      0.06,
      16
    );
    const brakeMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 60,
    });
    
    const brake = new THREE.Mesh(brakeGeometry, brakeMaterial);
    brake.rotation.z = Math.PI / 2;
    brake.position.x = 0.09;
    wheelGroup.add(brake);
    
    // Tire tread pattern (visual detail)
    const treadGeometry = new THREE.TorusGeometry(wheelSize * 0.9, 0.02, 4, 16);
    const treadMaterial = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    const tread = new THREE.Mesh(treadGeometry, treadMaterial);
    tread.rotation.y = Math.PI / 2;
    wheelGroup.add(tread);
    
    return wheelGroup;
  }

  private createCharacterPlaceholder(): void {
    // Create Business Cat character with basic shapes
    const catGroup = new THREE.Group();
    
    // Cat head (black sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 12);
    const furMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a, // Dark black fur
      shininess: 10,
    });
    
    const head = new THREE.Mesh(headGeometry, furMaterial);
    head.position.set(0, 0.25, 0);
    head.castShadow = true;
    catGroup.add(head);
    
    // Cat ears (black cones)
    const earGeometry = new THREE.ConeGeometry(0.08, 0.15, 6);
    
    const leftEar = new THREE.Mesh(earGeometry, furMaterial);
    leftEar.position.set(-0.15, 0.35, 0.05);
    leftEar.castShadow = true;
    catGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, furMaterial);
    rightEar.position.set(0.15, 0.35, 0.05);
    rightEar.castShadow = true;
    catGroup.add(rightEar);
    
    // Cat body (black ellipsoid)
    const bodyGeometry = new THREE.SphereGeometry(0.3, 12, 8);
    bodyGeometry.scale(1, 0.8, 1.2); // Make it more oval
    
    const body = new THREE.Mesh(bodyGeometry, furMaterial);
    body.position.set(0, -0.15, 0);
    body.castShadow = true;
    catGroup.add(body);
    
    // Business tie (red cylinder)
    const tieGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.4, 6);
    const tieMaterial = new THREE.MeshPhongMaterial({
      color: 0xcc0000, // Red business tie
      shininess: 30,
    });
    
    const tie = new THREE.Mesh(tieGeometry, tieMaterial);
    tie.position.set(0, -0.1, 0.25);
    tie.castShadow = true;
    catGroup.add(tie);
    
    // Eyes (white spheres with black pupils)
    const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 6);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 0.28, 0.22);
    catGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 0.28, 0.22);
    catGroup.add(rightEye);
    
    // Eye pupils (black spheres)
    const pupilGeometry = new THREE.SphereGeometry(0.02, 6, 4);
    const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.08, 0.28, 0.24);
    catGroup.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.08, 0.28, 0.24);
    catGroup.add(rightPupil);
    
    // Position the cat in sitting position in the kart
    catGroup.position.set(0, 0.8, 0.2);
    catGroup.scale.setScalar(1.2); // Make it slightly bigger
    
    this.group.add(catGroup);
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

  public update(deltaTime: number = 0.016): void {
    this.updatePhysics(deltaTime);
    this.updateState();
    this.updateVisuals();
    this.updateWheelRotation(deltaTime);
    this.updateParticleEffects(deltaTime);
  }

  private updatePhysics(_deltaTime: number = 0.016): void {
    // SUPER MARIO KART SNES-STYLE ARCADE PHYSICS
    
    // Get current speed for calculations
    const velocity = this.physicsBody.velocity;
    const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    
    // Mario Kart physics constants (tuned for zippy arcade feel)
    const MAX_SPEED = 18; // Top speed in units/second
    const QUICK_ACCEL_SPEED = 8; // Speed where quick acceleration stops
    const INITIAL_ACCEL_FORCE = 15000; // Strong initial boost
    const SUSTAINED_ACCEL_FORCE = 8000; // Sustained acceleration
    const BRAKE_FORCE = 12000; // Strong braking
    const STEERING_FORCE = 8000; // Responsive steering
    const STEERING_SPEED_MULTIPLIER = 0.7; // How much speed affects steering
    // const DRAG_COEFFICIENT = 0.98; // Gentle drag to maintain speed
    const ANGULAR_DAMPING = 0.85; // Prevent excessive spinning
    
    // === ACCELERATION SYSTEM ===
    if (this.controls.accelerate > 0) {
      // Get forward direction from kart's rotation
      const forwardDirection = new CANNON.Vec3(0, 0, -1);
      this.physicsBody.quaternion.vmult(forwardDirection, forwardDirection);
      
      // Mario Kart-style acceleration curve: quick start, gradual top speed
      let accelerationForce: number;
      
      if (currentSpeed < QUICK_ACCEL_SPEED) {
        // Phase 1: Quick acceleration from 0-8 speed (zippy start)
        const speedRatio = currentSpeed / QUICK_ACCEL_SPEED;
        accelerationForce = INITIAL_ACCEL_FORCE * (1 - speedRatio * 0.4);
      } else if (currentSpeed < MAX_SPEED) {
        // Phase 2: Gradual acceleration from 8-18 speed (building to top speed)
        const speedRatio = (currentSpeed - QUICK_ACCEL_SPEED) / (MAX_SPEED - QUICK_ACCEL_SPEED);
        accelerationForce = SUSTAINED_ACCEL_FORCE * (1 - speedRatio * 0.8);
      } else {
        // Phase 3: Minimal force at top speed (maintain momentum)
        accelerationForce = 1000;
      }
      
      // Apply the force
      const force = forwardDirection.clone();
      force.scale(accelerationForce * this.controls.accelerate, force);
      this.physicsBody.applyForce(force);
      
      this.engineForce = accelerationForce;
    } else {
      this.engineForce = 0;
    }
    
    // === BRAKING SYSTEM ===
    if (this.controls.brake > 0) {
      // Apply counter-force based on current velocity direction
      const brakeForce = velocity.clone();
      brakeForce.scale(-BRAKE_FORCE * this.controls.brake, brakeForce);
      this.physicsBody.applyForce(brakeForce);
    }
    
    // === STEERING SYSTEM ===
    this.steerValue = this.controls.steering * this.config.physics.maxSteerAngle;
    
    if (Math.abs(this.steerValue) > 0.01) {
      // Speed-dependent steering: faster = less responsive (realistic but still arcade-y)
      const speedFactor = Math.max(0.3, 1 - (currentSpeed / MAX_SPEED) * STEERING_SPEED_MULTIPLIER);
      
      // Direct velocity manipulation for immediate response (Mario Kart style)
      const steerDirection = new CANNON.Vec3(-1, 0, 0); // Left/right vector
      this.physicsBody.quaternion.vmult(steerDirection, steerDirection);
      
      // Apply lateral force for turning
      const steerForce = steerDirection.clone();
      steerForce.scale(STEERING_FORCE * this.steerValue * speedFactor * currentSpeed, steerForce);
      this.physicsBody.applyForce(steerForce);
      
      // Also apply angular velocity for rotation
      const torqueStrength = 150 * speedFactor;
      const torque = new CANNON.Vec3(0, this.steerValue * torqueStrength, 0);
      this.physicsBody.applyTorque(torque);
    }
    
    // === DRIFT DETECTION ===
    if (Math.abs(this.steerValue) > 0.3 && currentSpeed > 5) {
      this.state.isDrifting = true;
      this.state.driftLevel = Math.min(1.0, Math.abs(this.steerValue) * (currentSpeed / MAX_SPEED));
    } else {
      this.state.isDrifting = false;
      this.state.driftLevel = 0;
    }
    
    // === DRAG AND STABILITY ===
    // Gentle speed-based drag (preserves Mario Kart momentum)
    const horizontalVelocity = new CANNON.Vec3(velocity.x, 0, velocity.z);
    const drag = horizontalVelocity.clone();
    drag.scale(-currentSpeed * 8, drag); // Gentle drag
    this.physicsBody.applyForce(drag);
    
    // Angular damping to prevent excessive spinning
    this.physicsBody.angularVelocity.scale(ANGULAR_DAMPING, this.physicsBody.angularVelocity);
    
    // Ground stabilization (keep kart upright)
    if (this.state.isGrounded) {
      const uprightTorque = new CANNON.Vec3(
        -this.physicsBody.quaternion.x * 2000,
        0,
        -this.physicsBody.quaternion.z * 2000
      );
      this.physicsBody.applyTorque(uprightTorque);
    }
    
    // === SPEED LIMITING ===
    // Enforce maximum speed (important for game balance)
    if (currentSpeed > MAX_SPEED) {
      const limitingFactor = MAX_SPEED / currentSpeed;
      velocity.x *= limitingFactor;
      velocity.z *= limitingFactor;
      this.physicsBody.velocity.set(velocity.x, velocity.y, velocity.z);
    }
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

  private updateWheelRotation(deltaTime: number = 0.016): void {
    // Rotate wheels based on speed
    const wheelRotation = (this.state.speed / this.config.visual.wheelSize) * deltaTime;
    
    this.wheels.forEach((wheel, index) => {
      // Rolling rotation around X-axis
      wheel.rotation.x += wheelRotation;
      
      // Steering rotation around Y-axis (ONLY front wheels)
      if (index < 2) { // Front wheels (0=front-left, 1=front-right)
        wheel.rotation.y = this.steerValue;
        
        // Visual indicator - make front wheels more obvious
        const frontWheelIndicator = wheel.getObjectByName('front-indicator');
        if (frontWheelIndicator) {
          frontWheelIndicator.visible = true;
        }
      } else {
        // Rear wheels don't steer
        wheel.rotation.y = 0;
      }
    });
  }

  private updateParticleEffects(_deltaTime: number = 0.016): void {
    if (!this.particleSystem) return;

    const currentTime = performance.now();
    
    // Tire smoke when drifting or braking hard
    if (this.state.isDrifting || (this.controls.brake > 0.5 && this.state.speed > 5)) {
      if (currentTime - this.lastParticleTime > 50) { // 20fps particle generation
        this.wheels.forEach((wheel, index) => {
          const wheelWorldPos = new THREE.Vector3();
          wheel.getWorldPosition(wheelWorldPos);
          
          const kartVelocity = new THREE.Vector3(
            this.state.velocity.x,
            this.state.velocity.y,
            this.state.velocity.z
          );
          
          // More smoke from rear wheels during drifting
          const intensity = (index >= 2) ? 1.5 : 1.0;
          this.particleSystem!.createTireSmokeEffect(wheelWorldPos, kartVelocity, intensity);
        });
        this.lastParticleTime = currentTime;
      }
    }

    // Exhaust smoke when accelerating
    if (this.controls.accelerate > 0.3) {
      if (currentTime - this.lastParticleTime > 100) { // 10fps exhaust
        const exhaustPos = this.group.position.clone();
        exhaustPos.y += 0.3;
        exhaustPos.z -= 1.5; // Behind the kart
        
        const kartVelocity = new THREE.Vector3(
          this.state.velocity.x,
          this.state.velocity.y,
          this.state.velocity.z
        );
        
        this.particleSystem!.createExhaustEffect(exhaustPos, kartVelocity);
      }
    }

    // Dust when off-track (this would need track surface detection)
    if (this.state.speed > 2 && currentTime - this.lastParticleTime > 80) {
      // Simple check - assume off-track if Y position is low
      if (this.state.position.y < 0.5) {
        const kartPos = new THREE.Vector3(
          this.state.position.x,
          this.state.position.y,
          this.state.position.z
        );
        
        const kartVelocity = new THREE.Vector3(
          this.state.velocity.x,
          this.state.velocity.y,
          this.state.velocity.z
        );
        
        this.particleSystem!.createDustEffect(kartPos, kartVelocity);
      }
    }
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