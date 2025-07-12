# Physics and Kart Mechanics Design

## Physics Engine Selection

### Recommended: Cannon.js
**Advantages:**
- Lightweight and optimized for web
- Excellent Three.js integration
- Active community and documentation
- Suitable for arcade-style physics
- Good performance on various devices

**Implementation:**
```typescript
import * as CANNON from 'cannon-es';
import { CannonDebugger } from 'cannon-es-debugger';

class PhysicsWorld {
  public world: CANNON.World;
  private debugger?: CannonDebugger;

  constructor(gravity: number = -9.82) {
    this.world = new CANNON.World();
    this.world.gravity.set(0, gravity, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
  }
}
```

## Kart Physics System

### Core Kart Configuration
```typescript
interface KartPhysicsConfig {
  // Basic properties
  mass: number;                    // Kart weight in kg
  enginePower: number;            // Maximum engine force
  maxSteerAngle: number;          // Maximum steering angle in radians
  
  // Wheel properties
  wheelRadius: number;            // Wheel radius in meters
  wheelFriction: number;          // Tire grip coefficient
  rollResistance: number;         // Rolling resistance factor
  
  // Suspension
  suspensionStiffness: number;    // Spring stiffness
  suspensionDamping: number;      // Shock absorber damping
  suspensionCompression: number;  // Maximum compression
  
  // Aerodynamics
  dragCoefficient: number;        // Air resistance
  downforceCoefficient: number;   // Downforce generation
  
  // Handling characteristics
  centerOfMassHeight: number;     // Height of center of mass
  trackWidth: number;             // Distance between left/right wheels
  wheelbase: number;              // Distance between front/rear axles
}
```

### Character-Specific Configurations
```typescript
const kartConfigs: Record<CharacterType, KartPhysicsConfig> = {
  businessCat: {
    mass: 180,
    enginePower: 750,
    maxSteerAngle: Math.PI / 6,
    wheelRadius: 0.3,
    wheelFriction: 1.2,
    rollResistance: 0.01,
    suspensionStiffness: 40,
    suspensionDamping: 0.3,
    suspensionCompression: 0.1,
    dragCoefficient: 0.25,
    downforceCoefficient: 0.1,
    centerOfMassHeight: 0.4,
    trackWidth: 1.2,
    wheelbase: 1.5
  },
  executiveDog: {
    mass: 220,  // Heavier for stability
    enginePower: 800,
    maxSteerAngle: Math.PI / 7,  // Less agile steering
    wheelRadius: 0.32,
    wheelFriction: 1.1,
    rollResistance: 0.012,
    suspensionStiffness: 45,
    suspensionDamping: 0.35,
    suspensionCompression: 0.12,
    dragCoefficient: 0.3,  // More drag
    downforceCoefficient: 0.15,  // More stability
    centerOfMassHeight: 0.45,
    trackWidth: 1.3,
    wheelbase: 1.6
  }
  // ... additional character configurations
};
```

## Vehicle Dynamics

### Acceleration System
```typescript
class KartAcceleration {
  private engineForce: number = 0;
  private brakeForce: number = 0;
  
  update(input: InputState, deltaTime: number): void {
    // Calculate engine force based on input and RPM
    if (input.accelerate) {
      const targetForce = this.config.enginePower;
      const rpmFactor = this.calculateRPMFactor();
      this.engineForce = targetForce * rpmFactor;
    } else if (input.brake) {
      this.brakeForce = this.config.maxBrakeForce;
      this.engineForce = 0;
    } else {
      // Natural deceleration
      this.engineForce = 0;
      this.brakeForce = this.config.rollResistance * this.kart.mass;
    }
    
    // Apply forces to physics body
    this.applyDriveForce();
    this.applyBrakeForce();
  }
  
  private calculateRPMFactor(): number {
    // Simulate engine power curve
    const speed = this.kart.velocity.length();
    const maxSpeed = this.config.maxSpeed;
    const rpm = (speed / maxSpeed) * 8000; // Max 8000 RPM
    
    // Power curve: peak at ~5000 RPM
    if (rpm < 2000) return rpm / 2000 * 0.8;
    if (rpm < 5000) return 0.8 + (rpm - 2000) / 3000 * 0.2;
    if (rpm < 7000) return 1.0 - (rpm - 5000) / 2000 * 0.3;
    return 0.7; // Over-rev protection
  }
}
```

### Steering System
```typescript
class KartSteering {
  private steerAngle: number = 0;
  private readonly steerSpeed: number = 3.0; // rad/sec
  
  update(input: InputState, deltaTime: number): void {
    let targetSteer = 0;
    
    if (input.steerLeft) {
      targetSteer = -this.config.maxSteerAngle;
    } else if (input.steerRight) {
      targetSteer = this.config.maxSteerAngle;
    }
    
    // Apply speed-sensitive steering
    const speedFactor = this.calculateSpeedSensitivity();
    targetSteer *= speedFactor;
    
    // Smooth steering interpolation
    this.steerAngle = this.lerp(
      this.steerAngle, 
      targetSteer, 
      this.steerSpeed * deltaTime
    );
    
    // Apply steering to front wheels
    this.applySteeringForce();
  }
  
  private calculateSpeedSensitivity(): number {
    const speed = this.kart.velocity.length();
    const normalizedSpeed = speed / this.config.maxSpeed;
    
    // Reduce steering sensitivity at high speeds
    return Math.max(0.3, 1.0 - normalizedSpeed * 0.7);
  }
}
```

### Drift Mechanics
```typescript
class KartDrift {
  private isDrifting: boolean = false;
  private driftAngle: number = 0;
  private driftBoostTimer: number = 0;
  private driftLevel: number = 0; // 0: no drift, 1-3: boost levels
  
  update(input: InputState, deltaTime: number): void {
    const lateralSlip = this.calculateLateralSlip();
    const isIntentionalDrift = input.drift && Math.abs(input.steering) > 0.3;
    
    // Detect drift conditions
    if (isIntentionalDrift && lateralSlip > this.driftThreshold) {
      if (!this.isDrifting) {
        this.startDrift();
      }
      this.updateDriftState(deltaTime);
    } else if (this.isDrifting) {
      this.endDrift();
    }
    
    // Apply drift physics
    if (this.isDrifting) {
      this.applyDriftForces();
      this.generateDriftParticles();
    }
  }
  
  private calculateLateralSlip(): number {
    const velocity = this.kart.velocity;
    const forward = this.kart.forward;
    const right = this.kart.right;
    
    // Project velocity onto right vector (lateral component)
    const lateralVelocity = velocity.dot(right);
    const forwardVelocity = velocity.dot(forward);
    
    return Math.abs(lateralVelocity / Math.max(forwardVelocity, 1));
  }
  
  private updateDriftState(deltaTime: number): void {
    this.driftBoostTimer += deltaTime;
    
    // Determine drift boost level based on duration
    if (this.driftBoostTimer > 2.5) {
      this.driftLevel = 3; // Purple boost
    } else if (this.driftBoostTimer > 1.5) {
      this.driftLevel = 2; // Orange boost
    } else if (this.driftBoostTimer > 0.8) {
      this.driftLevel = 1; // Blue boost
    }
  }
  
  private endDrift(): void {
    if (this.driftLevel > 0) {
      this.applyDriftBoost();
    }
    
    this.isDrifting = false;
    this.driftBoostTimer = 0;
    this.driftLevel = 0;
  }
  
  private applyDriftBoost(): void {
    const boostMultipliers = [1.0, 1.15, 1.25, 1.4]; // No boost, blue, orange, purple
    const boostDuration = [0, 1.0, 1.5, 2.0];
    
    const multiplier = boostMultipliers[this.driftLevel];
    const duration = boostDuration[this.driftLevel];
    
    this.kart.applySpeedBoost(multiplier, duration);
    this.triggerBoostEffects(this.driftLevel);
  }
}
```

## Collision Detection

### Kart-to-Kart Collisions
```typescript
class KartCollisionSystem {
  private readonly elasticity: number = 0.4;
  private readonly minCollisionImpulse: number = 5.0;
  
  handleKartCollision(kartA: Kart, kartB: Kart, contact: CANNON.ContactEquation): void {
    const relativeVelocity = kartA.velocity.clone().sub(kartB.velocity);
    const collisionNormal = contact.ni;
    
    // Calculate collision impulse
    const impulse = relativeVelocity.dot(collisionNormal);
    
    if (Math.abs(impulse) < this.minCollisionImpulse) return;
    
    // Apply collision effects
    this.applyCollisionForces(kartA, kartB, contact, impulse);
    this.triggerCollisionEffects(kartA, kartB, impulse);
    
    // Handle item dropping on hard collisions
    if (Math.abs(impulse) > 15.0) {
      this.handleItemDrop(kartA, kartB);
    }
  }
  
  private applyCollisionForces(
    kartA: Kart, 
    kartB: Kart, 
    contact: CANNON.ContactEquation, 
    impulse: number
  ): void {
    const massRatio = kartA.mass / (kartA.mass + kartB.mass);
    const forceA = contact.ni.clone().scale(-impulse * (1 - massRatio));
    const forceB = contact.ni.clone().scale(impulse * massRatio);
    
    kartA.physicsBody.applyImpulse(forceA);
    kartB.physicsBody.applyImpulse(forceB);
  }
}
```

### Track Collision System
```typescript
class TrackCollisionSystem {
  private trackBounds: CANNON.Body[] = [];
  private boostPads: BoostPad[] = [];
  private hazards: TrackHazard[] = [];
  
  setupTrackPhysics(track: Track): void {
    // Create collision meshes for track boundaries
    this.createTrackBoundaries(track.boundaryMesh);
    
    // Set up boost pads
    track.boostPads.forEach(pad => {
      this.createBoostPadTrigger(pad);
    });
    
    // Configure hazards
    track.hazards.forEach(hazard => {
      this.createHazardTrigger(hazard);
    });
  }
  
  private createBoostPadTrigger(pad: BoostPad): void {
    const shape = new CANNON.Box(new CANNON.Vec3(pad.width/2, 0.1, pad.length/2));
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.copy(pad.position);
    body.isTrigger = true;
    body.userData = { type: 'boostPad', data: pad };
    
    this.physicsWorld.addBody(body);
  }
}
```

## Jump and Air Physics

### Jump Mechanics
```typescript
class KartJumpSystem {
  private isAirborne: boolean = false;
  private groundContactPoints: number = 0;
  private airTime: number = 0;
  
  update(deltaTime: number): void {
    this.checkGroundContact();
    
    if (this.isAirborne) {
      this.updateAirPhysics(deltaTime);
      this.airTime += deltaTime;
    } else {
      if (this.airTime > 0.1) {
        this.handleLanding();
      }
      this.airTime = 0;
    }
  }
  
  private updateAirPhysics(deltaTime: number): void {
    // Reduced control in air
    const airControlFactor = 0.3;
    this.kart.steeringInfluence *= airControlFactor;
    
    // Air resistance
    const airDrag = this.kart.velocity.clone().scale(-0.05);
    this.kart.physicsBody.applyForce(airDrag);
    
    // Rotation damping to prevent excessive spinning
    const angularDamping = this.kart.physicsBody.angularVelocity.clone().scale(-0.8);
    this.kart.physicsBody.applyTorque(angularDamping);
  }
  
  private handleLanding(): void {
    const landingImpact = Math.abs(this.kart.velocity.y);
    
    if (landingImpact > 5.0) {
      // Hard landing effects
      this.triggerHardLanding(landingImpact);
      
      if (landingImpact > 10.0) {
        // Temporary handling penalty for very hard landings
        this.kart.applyHandlingPenalty(0.7, 1.0);
      }
    }
    
    // Landing sound and particle effects
    this.triggerLandingEffects(landingImpact);
  }
}
```

## Power-Up Physics Integration

### Speed Boost Implementation
```typescript
class SpeedBoostEffect {
  private originalMaxSpeed: number;
  private boostMultiplier: number;
  private duration: number;
  private timer: number = 0;
  
  apply(kart: Kart, multiplier: number, duration: number): void {
    this.originalMaxSpeed = kart.config.maxSpeed;
    this.boostMultiplier = multiplier;
    this.duration = duration;
    this.timer = 0;
    
    // Apply boost
    kart.config.maxSpeed *= multiplier;
    kart.config.enginePower *= multiplier;
    
    // Visual effects
    this.triggerBoostTrail(kart);
  }
  
  update(deltaTime: number): boolean {
    this.timer += deltaTime;
    
    if (this.timer >= this.duration) {
      this.remove();
      return false; // Effect finished
    }
    
    return true; // Effect continues
  }
  
  private remove(): void {
    // Restore original values
    this.kart.config.maxSpeed = this.originalMaxSpeed;
    this.kart.config.enginePower = this.originalMaxSpeed;
    
    // Remove visual effects
    this.removeBoostTrail();
  }
}
```

### Item Physics
```typescript
class ItemPhysics {
  createProjectile(item: ProjectileItem, launcher: Kart): CANNON.Body {
    const shape = new CANNON.Sphere(item.radius);
    const body = new CANNON.Body({ mass: item.mass });
    body.addShape(shape);
    
    // Launch from kart position
    const launchPosition = launcher.position.clone();
    launchPosition.y += 1.0; // Above kart
    body.position.copy(launchPosition);
    
    // Calculate launch velocity
    const launchDirection = this.calculateLaunchDirection(launcher, item);
    const launchVelocity = launchDirection.scale(item.launchSpeed);
    body.velocity.copy(launchVelocity);
    
    // Configure collision behavior
    body.material.friction = 0.3;
    body.material.restitution = 0.6;
    
    return body;
  }
  
  private calculateLaunchDirection(launcher: Kart, item: ProjectileItem): CANNON.Vec3 {
    if (item.type === 'briefcaseMissile' && item.target) {
      // Homing projectile - aim at target
      const direction = item.target.position.clone().sub(launcher.position);
      direction.normalize();
      direction.y += 0.2; // Slight upward angle
      return direction;
    } else {
      // Straight projectile - launch forward
      const forward = launcher.forward.clone();
      forward.y += 0.15; // Slight arc
      return forward;
    }
  }
}
```

## Performance Optimization

### Physics Optimization Strategies
```typescript
class PhysicsOptimizer {
  private readonly maxPhysicsDistance: number = 100; // meters
  private lastOptimizationTime: number = 0;
  private readonly optimizationInterval: number = 1000; // ms
  
  optimizePhysicsObjects(playerPosition: CANNON.Vec3, deltaTime: number): void {
    const now = Date.now();
    if (now - this.lastOptimizationTime < this.optimizationInterval) return;
    
    this.physicsWorld.bodies.forEach(body => {
      if (body.userData?.isOptimizable) {
        const distance = body.position.distanceTo(playerPosition);
        
        if (distance > this.maxPhysicsDistance) {
          // Disable physics for distant objects
          body.type = CANNON.Body.KINEMATIC;
        } else {
          // Re-enable physics for nearby objects
          body.type = CANNON.Body.DYNAMIC;
        }
      }
    });
    
    this.lastOptimizationTime = now;
  }
  
  updateFixedTimeStep(deltaTime: number): void {
    // Use fixed timestep for consistent physics
    const fixedTimeStep = 1/60; // 60 FPS physics
    const maxSubSteps = 3;
    
    this.physicsWorld.step(fixedTimeStep, deltaTime, maxSubSteps);
  }
}
```

### LOD Physics System
```typescript
class PhysicsLOD {
  private readonly lodLevels = {
    high: { maxDistance: 20, updateRate: 60 },    // Full physics
    medium: { maxDistance: 50, updateRate: 30 },  // Reduced fidelity
    low: { maxDistance: 100, updateRate: 15 },    // Basic physics
    culled: { maxDistance: Infinity, updateRate: 0 } // No physics
  };
  
  updateObjectLOD(obj: PhysicsObject, distanceToPlayer: number): void {
    let targetLOD = 'culled';
    
    for (const [level, config] of Object.entries(this.lodLevels)) {
      if (distanceToPlayer <= config.maxDistance) {
        targetLOD = level;
        break;
      }
    }
    
    if (obj.currentLOD !== targetLOD) {
      this.transitionToLOD(obj, targetLOD);
    }
  }
}
```

## Debug and Testing Tools

### Physics Debug Visualization
```typescript
class PhysicsDebugRenderer {
  private debugRenderer: CannonDebugger;
  private enabled: boolean = false;
  
  enable(): void {
    this.debugRenderer = new CannonDebugger(this.scene, this.physicsWorld);
    this.enabled = true;
  }
  
  update(): void {
    if (this.enabled) {
      this.debugRenderer.update();
      this.renderDebugInfo();
    }
  }
  
  private renderDebugInfo(): void {
    // Display physics stats
    const stats = {
      bodies: this.physicsWorld.bodies.length,
      contacts: this.physicsWorld.contacts.length,
      stepTime: this.physicsWorld.lastStepTime,
      broadphaseTime: this.physicsWorld.broadphase.lastTime
    };
    
    this.displayDebugStats(stats);
  }
}
```

### Physics Unit Tests
```typescript
// physics.test.ts
describe('Kart Physics', () => {
  let kart: Kart;
  let physicsWorld: PhysicsWorld;
  
  beforeEach(() => {
    physicsWorld = new PhysicsWorld();
    kart = new Kart(kartConfigs.businessCat, physicsWorld);
  });
  
  describe('acceleration', () => {
    it('should increase velocity when accelerating', () => {
      const initialSpeed = kart.velocity.length();
      kart.accelerate(1.0);
      physicsWorld.step(1/60);
      
      expect(kart.velocity.length()).toBeGreaterThan(initialSpeed);
    });
    
    it('should respect maximum speed', () => {
      // Apply maximum acceleration for extended time
      for (let i = 0; i < 300; i++) {
        kart.accelerate(1.0);
        physicsWorld.step(1/60);
      }
      
      expect(kart.velocity.length()).toBeLessThanOrEqual(kart.config.maxSpeed * 1.01);
    });
  });
  
  describe('drift mechanics', () => {
    it('should trigger drift boost after sustained drift', () => {
      const mockInput = { drift: true, steering: 0.8, accelerate: true };
      
      // Simulate 2 seconds of drifting
      for (let i = 0; i < 120; i++) {
        kart.updateDrift(mockInput, 1/60);
        physicsWorld.step(1/60);
      }
      
      expect(kart.driftSystem.driftLevel).toBeGreaterThan(0);
    });
  });
});
```