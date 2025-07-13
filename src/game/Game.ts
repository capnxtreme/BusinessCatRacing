// Main game class that orchestrates all systems

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Renderer } from '@/engine/Renderer';
import { PhysicsWorld } from '@/engine/PhysicsWorld';
import { InputManager } from '@/game/InputManager';
import { Kart } from '@/entities/Kart';
import type { GameConfig, PerformanceMetrics } from '@/types/game.types';
import { GameState } from '@/types/game.types';
import type { PhysicsConfig } from '@/types/physics.types';
import type { KartConfig } from '@/types/kart.types';
import { CharacterType } from '@/types/character.types';
import { InputContext } from '@/types/input.types';

export class Game {
  private container: HTMLElement;
  private config: GameConfig;
  private renderer!: Renderer;
  private physics!: PhysicsWorld;
  private inputManager!: InputManager;
  private playerKart!: Kart;
  private gameState: GameState = GameState.LOADING;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private performanceMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderCalls: 0,
  };

  constructor(container: HTMLElement, config: GameConfig) {
    this.container = container;
    this.config = config;
  }

  public async initialize(): Promise<void> {
    console.log('Initializing Business Cat Racing...');

    try {
      // Initialize renderer
      this.renderer = new Renderer(this.container);
      
      // Initialize physics
      const physicsConfig: PhysicsConfig = {
        gravity: -9.82,
        solverIterations: 10,
        enableDebugRenderer: this.config.enablePhysicsDebug,
        fixedTimeStep: 1/60,
        maxSubSteps: 3,
      };
      this.physics = new PhysicsWorld(physicsConfig);

      // Initialize input manager
      this.inputManager = new InputManager();
      this.inputManager.initialize(); // This should attach event listeners
      this.inputManager.setContext(InputContext.RACING);
      this.inputManager.setEnabled(true);
      console.log('🎮 InputManager setup complete, context:', InputContext.RACING);

      // Enable physics debug renderer if in development
      if (this.config.enablePhysicsDebug) {
        this.physics.enableDebugRenderer(this.renderer.getScene());
      }

      // Create game scene
      this.createGameScene();

      this.gameState = GameState.MENU;
      console.log('Game initialized successfully');

    } catch (error) {
      this.gameState = GameState.ERROR;
      throw new Error(`Failed to initialize game: ${error}`);
    }
  }

  private createGameScene(): void {
    const scene = this.renderer.getScene();

    // Add a simple ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add physics for ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.physics.addBody('ground', groundBody, ground, 'track');

    // Create Business Cat kart
    this.createPlayerKart();
    
    // Position camera behind kart
    const camera = this.renderer.getCamera();
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
  }

  private createPlayerKart(): void {
    // Business Cat kart configuration
    const kartConfig: KartConfig = {
      physics: {
        mass: 180,
        enginePower: 5000,
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
        wheelbase: 1.5,
      },
      visual: {
        bodyColor: '#0066CC',
        bodyMaterial: 'standard',
        wheelColor: '#333333',
        wheelSize: 0.3,
        kartScale: { x: 2, y: 0.8, z: 3 },
        characterScale: { x: 1, y: 1, z: 1 },
      },
      character: CharacterType.BUSINESS_CAT,
      customization: {
        bodyColor: '#0066CC',
        wheelType: 'standard',
        accessories: [],
        decals: [],
      },
    };

    // Create the kart
    this.playerKart = new Kart(kartConfig, this.physics);
    this.playerKart.setPosition({ x: 0, y: 2, z: 0 });
    
    // Add kart to scene
    this.renderer.getScene().add(this.playerKart.getGroup());
  }


  public start(): void {
    if (this.isRunning) {
      console.warn('Game is already running');
      return;
    }

    if (!this.renderer || !this.physics) {
      console.warn('Game not initialized, cannot start');
      return;
    }

    console.log('Starting game loop...');
    this.isRunning = true;
    this.gameState = GameState.RACING;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  public stop(): void {
    this.isRunning = false;
    this.gameState = GameState.PAUSED;
    console.log('Game stopped');
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 1/30); // Cap at 30fps minimum
    this.lastFrameTime = currentTime;

    // Update game systems
    this.update(deltaTime);
    this.render();

    // Update performance metrics
    this.updatePerformanceMetrics(currentTime, deltaTime);

    // Schedule next frame
    requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    // Update input system
    this.inputManager.update(deltaTime);

    // Update kart with input
    if (this.playerKart) {
      this.updateKartControls();
      this.playerKart.update(deltaTime);
    }

    // Update physics simulation
    this.physics.step(deltaTime);

    // Update visual objects to match physics bodies
    this.syncPhysicsToVisuals();

    // Update debug renderer if enabled
    if (this.config.enablePhysicsDebug) {
      this.physics.updateDebugRenderer();
    }
  }

  private updateKartControls(): void {
    const inputState = this.inputManager.getInputState();
    
    // Debug: Log raw input state every few frames
    if (this.frameCount % 60 === 0) {
      console.log('Raw input state:', inputState);
    }
    
    // Convert input state to kart controls
    let accelerate = 0;
    let brake = 0;
    let steering = 0;

    if (inputState.accelerate) accelerate = 1;
    if (inputState.brake) brake = 1;
    if (inputState.steerLeft) steering = -1;
    if (inputState.steerRight) steering = 1;

    // Debug logging - always log to see if ANY input is detected
    if (accelerate > 0 || brake > 0 || Math.abs(steering) > 0) {
      console.log('🎮 CONTROLS DETECTED:', { accelerate, brake, steering });
    }

    this.playerKart.setControls({
      accelerate,
      brake,
      steering,
      drift: inputState.drift,
      useItem: inputState.useItem,
      lookBehind: inputState.lookBehind,
    });
  }

  private syncPhysicsToVisuals(): void {
    // Sync all physics bodies with their visual meshes
    const bodies = this.physics.getAllBodies();
    
    bodies.forEach((physicsBody) => {
      if (physicsBody.mesh) {
        // Copy position from physics body to mesh
        physicsBody.mesh.position.copy(physicsBody.body.position as any);
        
        // Copy rotation from physics body to mesh
        physicsBody.mesh.quaternion.copy(physicsBody.body.quaternion as any);
      }
    });
  }

  private render(): void {
    this.renderer.render();
  }

  private updatePerformanceMetrics(_currentTime: number, deltaTime: number): void {
    this.frameCount++;
    
    // Update FPS every second
    if (this.frameCount % 60 === 0) {
      this.performanceMetrics.fps = Math.round(1 / deltaTime);
      this.performanceMetrics.frameTime = deltaTime * 1000; // Convert to milliseconds
      
      // Get memory usage if available
      if ((performance as any).memory) {
        this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
      }

      // Log performance in development (reduced frequency)
      if (this.config.enablePerformanceMonitoring && this.frameCount % 3600 === 0) {
        console.log('Performance:', this.performanceMetrics);
      }
    }
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  public dispose(): void {
    this.stop();
    if (this.inputManager) {
      this.inputManager.dispose();
    }
    if (this.playerKart) {
      this.playerKart.dispose();
    }
    if (this.physics) {
      this.physics.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    console.log('Game disposed');
  }
}