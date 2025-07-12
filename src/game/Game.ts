// Main game class that orchestrates all systems

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Renderer } from '@/engine/Renderer';
import { PhysicsWorld } from '@/engine/PhysicsWorld';
import type { GameConfig, PerformanceMetrics } from '@/types/game.types';
import { GameState } from '@/types/game.types';
import type { PhysicsConfig } from '@/types/physics.types';

export class Game {
  private container: HTMLElement;
  private config: GameConfig;
  private renderer!: Renderer;
  private physics!: PhysicsWorld;
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

      // Enable physics debug renderer if in development
      if (this.config.enablePhysicsDebug) {
        this.physics.enableDebugRenderer(this.renderer.getScene());
      }

      // Create a simple test scene
      this.createTestScene();

      this.gameState = GameState.MENU;
      console.log('Game initialized successfully');

    } catch (error) {
      this.gameState = GameState.ERROR;
      throw new Error(`Failed to initialize game: ${error}`);
    }
  }

  private createTestScene(): void {
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

    // Add a test cube
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x0066CC });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 5, 0);
    cube.castShadow = true;
    scene.add(cube);

    // Add physics for cube
    const cubeShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    const cubeBody = new CANNON.Body({ mass: 1 });
    cubeBody.addShape(cubeShape);
    cubeBody.position.set(0, 5, 0);
    this.physics.addBody('testCube', cubeBody, cube, 'kart');
  }

  public start(): void {
    if (this.isRunning) {
      console.warn('Game is already running');
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
    // Update physics simulation
    this.physics.step(deltaTime);

    // Update visual objects to match physics bodies
    this.syncPhysicsToVisuals();

    // Update debug renderer if enabled
    if (this.config.enablePhysicsDebug) {
      this.physics.updateDebugRenderer();
    }
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

      // Log performance in development
      if (this.config.enablePerformanceMonitoring && this.frameCount % 300 === 0) {
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
    this.physics.dispose();
    this.renderer.dispose();
    console.log('Game disposed');
  }
}