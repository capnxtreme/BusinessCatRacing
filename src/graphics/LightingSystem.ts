// Advanced lighting system with HDR, shadows, and realistic lighting

import * as THREE from 'three';

export interface LightingConfig {
  enableShadows: boolean;
  enableHDR: boolean;
  ambientIntensity: number;
  sunIntensity: number;
  shadowMapSize: number;
  enableBloom: boolean;
}

export class LightingSystem {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private config: LightingConfig;
  
  // Lights
  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private fillLights: THREE.SpotLight[] = [];
  
  // Environment
  private envMap?: THREE.CubeTexture;
  
  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, config: LightingConfig) {
    this.scene = scene;
    this.renderer = renderer;
    this.config = config;
    
    this.setupRenderer();
    this.createLights();
    this.createEnvironment();
  }

  private setupRenderer(): void {
    // Enable shadows
    if (this.config.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
      this.renderer.shadowMap.autoUpdate = true;
    }
    
    // Enable HDR tone mapping
    if (this.config.enableHDR) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    
    // Note: antialias and physicallyCorrectLights settings handled in renderer constructor
  }

  private createLights(): void {
    // Enhanced ambient light for global illumination
    this.ambientLight = new THREE.AmbientLight(
      0x4a6fa5, // Cool blue ambient
      this.config.ambientIntensity
    );
    this.scene.add(this.ambientLight);

    // Main sun light (directional)
    this.sunLight = new THREE.DirectionalLight(
      0xffffff, // Pure white sun
      this.config.sunIntensity
    );
    
    // Position sun for dramatic racing lighting
    this.sunLight.position.set(50, 100, 30);
    this.sunLight.target.position.set(0, 0, 0);
    
    // Configure shadows
    if (this.config.enableShadows) {
      this.sunLight.castShadow = true;
      
      // High-quality shadow settings
      this.sunLight.shadow.mapSize.width = this.config.shadowMapSize;
      this.sunLight.shadow.mapSize.height = this.config.shadowMapSize;
      
      // Shadow camera settings for optimal coverage
      const shadowCam = this.sunLight.shadow.camera as THREE.OrthographicCamera;
      shadowCam.left = -100;
      shadowCam.right = 100;
      shadowCam.top = 100;
      shadowCam.bottom = -100;
      shadowCam.near = 0.1;
      shadowCam.far = 200;
      
      // Soft shadow settings
      this.sunLight.shadow.bias = -0.0001;
      this.sunLight.shadow.normalBias = 0.02;
      this.sunLight.shadow.radius = 4;
      this.sunLight.shadow.blurSamples = 15;
    }
    
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Fill lights for racing atmosphere
    this.createFillLights();
  }

  private createFillLights(): void {
    // Track-side spotlights for professional racing look
    const trackPositions = [
      { x: 40, y: 15, z: 20, target: { x: 0, y: 0, z: 0 } },
      { x: -40, y: 15, z: 20, target: { x: 0, y: 0, z: 0 } },
      { x: 20, y: 15, z: -40, target: { x: 0, y: 0, z: 0 } },
      { x: -20, y: 15, z: -40, target: { x: 0, y: 0, z: 0 } },
    ];

    trackPositions.forEach((pos, index) => {
      const spotlight = new THREE.SpotLight(
        0xffd700, // Warm golden track lighting
        0.8,      // Intensity
        100,      // Distance
        Math.PI / 6, // Angle
        0.5,      // Penumbra for soft edges
        1.5       // Decay
      );
      
      spotlight.position.set(pos.x, pos.y, pos.z);
      spotlight.target.position.set(pos.target.x, pos.target.y, pos.target.z);
      
      // Enable shadows for some lights
      if (this.config.enableShadows && index < 2) {
        spotlight.castShadow = true;
        spotlight.shadow.mapSize.width = 512;
        spotlight.shadow.mapSize.height = 512;
        spotlight.shadow.camera.near = 1;
        spotlight.shadow.camera.far = 50;
      }
      
      this.scene.add(spotlight);
      this.scene.add(spotlight.target);
      this.fillLights.push(spotlight);
    });
  }

  private createEnvironment(): void {
    // Create HDR-like environment map
    this.createSkybox();
    
    // Set environment map for realistic reflections
    if (this.envMap) {
      this.scene.environment = this.envMap;
      this.scene.background = this.envMap;
    }
  }

  private createSkybox(): void {
    // Create procedural skybox with gradient
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    
    // Create sky gradient material
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87ceeb) }, // Sky blue
        bottomColor: { value: new THREE.Color(0xffffff) }, // White horizon
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(skyMesh);
    
    // Add some clouds for atmosphere
    this.createClouds();
  }

  private createClouds(): void {
    const cloudGroup = new THREE.Group();
    
    // Create simple cloud sprites
    for (let i = 0; i < 20; i++) {
      const cloudGeometry = new THREE.SphereGeometry(
        Math.random() * 10 + 5, // Random size
        8, 8
      );
      
      const cloudMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6
      });
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      
      // Random positioning in sky
      const angle = Math.random() * Math.PI * 2;
      const radius = 200 + Math.random() * 100;
      cloud.position.set(
        Math.cos(angle) * radius,
        50 + Math.random() * 30,
        Math.sin(angle) * radius
      );
      
      cloud.scale.set(
        1 + Math.random() * 2,
        0.5 + Math.random() * 0.5,
        1 + Math.random() * 2
      );
      
      cloudGroup.add(cloud);
    }
    
    this.scene.add(cloudGroup);
  }

  public updateLighting(timeOfDay: number = 0.5): void {
    // Dynamic time-of-day lighting (0 = night, 0.5 = noon, 1 = night)
    const dayIntensity = Math.sin(timeOfDay * Math.PI);
    
    // Update sun position for time of day
    const sunAngle = timeOfDay * Math.PI;
    this.sunLight.position.set(
      Math.cos(sunAngle) * 100,
      Math.sin(sunAngle) * 100,
      30
    );
    
    // Adjust light intensities
    this.sunLight.intensity = this.config.sunIntensity * Math.max(0.1, dayIntensity);
    this.ambientLight.intensity = this.config.ambientIntensity * (0.3 + dayIntensity * 0.7);
    
    // Update sun color based on time
    if (dayIntensity > 0.8) {
      this.sunLight.color.setHex(0xffffff); // Bright white
    } else if (dayIntensity > 0.3) {
      this.sunLight.color.setHex(0xffd700); // Golden hour
    } else {
      this.sunLight.color.setHex(0xff6600); // Sunset orange
    }
  }

  public enableDynamicLighting(): void {
    // Animate lights for racing excitement
    let time = 0;
    
    const animate = (): void => {
      time += 0.016; // ~60fps
      
      // Subtle light flickering for track lights
      this.fillLights.forEach((light, index) => {
        const flicker = 0.9 + Math.sin(time * 10 + index) * 0.1;
        light.intensity = 0.8 * flicker;
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  public adjustForPerformance(quality: 'low' | 'medium' | 'high'): void {
    switch (quality) {
      case 'low':
        this.config.shadowMapSize = 512;
        this.fillLights.forEach(light => light.castShadow = false);
        break;
      case 'medium':
        this.config.shadowMapSize = 1024;
        this.fillLights.slice(2).forEach(light => light.castShadow = false);
        break;
      case 'high':
        this.config.shadowMapSize = 2048;
        break;
    }
    
    // Apply shadow map size changes
    if (this.sunLight.shadow) {
      this.sunLight.shadow.mapSize.width = this.config.shadowMapSize;
      this.sunLight.shadow.mapSize.height = this.config.shadowMapSize;
      this.sunLight.shadow.map?.dispose();
      this.sunLight.shadow.map = null;
    }
  }

  public dispose(): void {
    // Clean up lighting resources
    this.fillLights.forEach(light => {
      this.scene.remove(light);
      this.scene.remove(light.target);
      if (light.shadow.map) {
        light.shadow.map.dispose();
      }
    });
    
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.sunLight);
    this.scene.remove(this.sunLight.target);
    
    if (this.sunLight.shadow.map) {
      this.sunLight.shadow.map.dispose();
    }
    
    if (this.envMap) {
      this.envMap.dispose();
    }
    
    console.log('LightingSystem disposed');
  }
}