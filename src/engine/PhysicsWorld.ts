// Cannon.js physics world setup and management

import * as CANNON from 'cannon-es';
import type { PhysicsConfig, PhysicsBody, CollisionEvent } from '@/types/physics.types';

export class PhysicsWorld {
  private world!: CANNON.World;
  private config: PhysicsConfig;
  private bodies: Map<string, PhysicsBody> = new Map();
  private debugRenderer?: any; // CannonDebugRenderer type not available
  private lastStepTime: number = 0;

  constructor(config: PhysicsConfig) {
    this.config = config;
    this.initializeWorld();
  }

  private initializeWorld(): void {
    this.world = new CANNON.World();
    
    // Set gravity
    this.world.gravity.set(0, this.config.gravity, 0);
    
    // Configure solver
    (this.world.solver as any).iterations = this.config.solverIterations;
    (this.world.solver as any).tolerance = 0.001;
    
    // Set up broadphase for collision detection optimization
    this.world.broadphase = new CANNON.NaiveBroadphase();
    
    // Enable collision events
    this.world.addEventListener('beginContact', this.handleCollision.bind(this));
    
    // Set up default materials and contact materials
    this.setupMaterials();
  }

  private setupMaterials(): void {
    // Create materials for different surface types
    const kartMaterial = new CANNON.Material('kart');
    const trackMaterial = new CANNON.Material('track');
    const itemMaterial = new CANNON.Material('item');

    // Define contact materials (how materials interact)
    const kartTrackContact = new CANNON.ContactMaterial(kartMaterial, trackMaterial, {
      friction: 0.8,
      restitution: 0.1,
    });

    const kartKartContact = new CANNON.ContactMaterial(kartMaterial, kartMaterial, {
      friction: 0.6,
      restitution: 0.4,
    });

    const kartItemContact = new CANNON.ContactMaterial(kartMaterial, itemMaterial, {
      friction: 0.3,
      restitution: 0.2,
    });

    // Add contact materials to world
    this.world.addContactMaterial(kartTrackContact);
    this.world.addContactMaterial(kartKartContact);
    this.world.addContactMaterial(kartItemContact);

    // Store materials for later use
    this.world.defaultMaterial = trackMaterial;
  }

  private handleCollision(event: any): void {
    try {
      const contact = event.contact;
      if (!contact || !contact.bi || !contact.bj) {
        console.warn('Invalid collision event:', event);
        return;
      }

      const bodyA = contact.bi;
      const bodyB = contact.bj;

      // Calculate collision impulse safely
      let impulse = 0;
      try {
        impulse = Math.abs(contact.getImpactVelocityAlongNormal());
      } catch (error) {
        console.warn('Could not calculate collision impulse:', error);
        impulse = 1.0; // Default value
      }

      const collisionEvent: CollisionEvent = {
        bodyA,
        bodyB,
        contact,
        impulse,
      };

      this.processCollisionEvent(collisionEvent);
    } catch (error) {
      console.error('Error in collision handler:', error);
    }
  }

  private processCollisionEvent(collision: CollisionEvent): void {
    // Handle different types of collisions
    const typeA = (collision.bodyA as any).userData?.type;
    const typeB = (collision.bodyB as any).userData?.type;

    if (typeA === 'kart' && typeB === 'kart') {
      this.handleKartCollision(collision);
    } else if ((typeA === 'kart' && typeB === 'item') || (typeA === 'item' && typeB === 'kart')) {
      this.handleItemCollision(collision);
    }
  }

  private handleKartCollision(collision: CollisionEvent): void {
    // Only process significant collisions
    if (collision.impulse > 5.0) {
      console.log('Kart collision detected:', collision.impulse);
      // TODO: Trigger collision effects, sounds, etc.
    }
  }

  private handleItemCollision(_collision: CollisionEvent): void {
    console.log('Item collision detected');
    // TODO: Handle item pickup/usage
  }

  public step(deltaTime: number): void {
    // Use fixed timestep for consistent physics
    this.world.step(
      this.config.fixedTimeStep,
      deltaTime,
      this.config.maxSubSteps
    );

    this.lastStepTime = deltaTime;
  }

  public addBody(id: string, body: CANNON.Body, mesh?: any, type: PhysicsBody['type'] = 'static'): void {
    this.world.addBody(body);
    
    const physicsBody: PhysicsBody = {
      body,
      mesh,
      type,
    };

    this.bodies.set(id, physicsBody);
    
    // Store type in body userData for collision handling
    (body as any).userData = { ...(body as any).userData, type, id };
  }

  public removeBody(id: string): void {
    const physicsBody = this.bodies.get(id);
    if (physicsBody) {
      this.world.removeBody(physicsBody.body);
      this.bodies.delete(id);
    }
  }

  public getBody(id: string): PhysicsBody | undefined {
    return this.bodies.get(id);
  }

  public getAllBodies(): Map<string, PhysicsBody> {
    return new Map(this.bodies);
  }

  public enableDebugRenderer(_scene: any): void {
    if (this.config.enableDebugRenderer && !this.debugRenderer) {
      // Note: cannon-es-debugger would need to be installed separately
      console.log('Physics debug renderer would be enabled here');
      // this.debugRenderer = new CannonDebugRenderer(scene, this.world);
    }
  }

  public updateDebugRenderer(): void {
    if (this.debugRenderer) {
      this.debugRenderer.update();
    }
  }

  public dispose(): void {
    // Clean up all bodies
    this.bodies.forEach((physicsBody) => {
      this.world.removeBody(physicsBody.body);
    });
    this.bodies.clear();

    // Remove event listeners
    this.world.removeEventListener('beginContact', this.handleCollision.bind(this));
  }

  public getWorld(): CANNON.World {
    return this.world;
  }

  public getPerformanceMetrics(): { stepTime: number; bodyCount: number } {
    return {
      stepTime: this.lastStepTime,
      bodyCount: this.bodies.size,
    };
  }
}