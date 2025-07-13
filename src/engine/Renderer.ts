// Enhanced renderer system for 3D graphics with advanced lighting

import * as THREE from 'three';
import { LightingSystem } from '@/graphics/LightingSystem';

export class Renderer {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private lightingSystem!: LightingSystem;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeRenderer();
    this.initializeScene();
    this.initializeCamera();
    this.setupEventListeners();
  }

  private initializeRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enhanced renderer settings for better visuals
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    // Note: physicallyCorrectLights deprecated in newer Three.js versions

    this.container.appendChild(this.renderer.domElement);
  }

  private initializeScene(): void {
    this.scene = new THREE.Scene();
    
    // Enhanced fog for atmospheric depth
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 800);

    // Initialize advanced lighting system
    this.setupAdvancedLighting();
  }

  private initializeCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      85, // Wider FOV for racing feel
      window.innerWidth / window.innerHeight,
      0.1,
      2000 // Extended far plane
    );
    
    // Default camera position
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
  }

  private setupAdvancedLighting(): void {
    this.lightingSystem = new LightingSystem(this.scene, this.renderer, {
      enableShadows: true,
      enableHDR: true,
      ambientIntensity: 0.4,
      sunIntensity: 2.5,
      shadowMapSize: 2048,
      enableBloom: true
    });
    
    // Enable dynamic lighting effects
    this.lightingSystem.enableDynamicLighting();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getLightingSystem(): LightingSystem {
    return this.lightingSystem;
  }

  public updateTimeOfDay(timeOfDay: number): void {
    this.lightingSystem.updateLighting(timeOfDay);
  }

  public setGraphicsQuality(quality: 'low' | 'medium' | 'high'): void {
    this.lightingSystem.adjustForPerformance(quality);
    
    // Adjust renderer settings based on quality
    switch (quality) {
      case 'low':
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;
        break;
      case 'medium':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        break;
      case 'high':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        break;
    }
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Dispose of lighting system
    this.lightingSystem.dispose();
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}