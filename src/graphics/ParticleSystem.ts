// Advanced particle system for racing effects

import * as THREE from 'three';

export interface ParticleEffect {
  name: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  opacity: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private effects: Map<string, THREE.Points> = new Map();
  private particles: Map<string, ParticleEffect[]> = new Map();
  private maxParticles: number = 1000;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createTireSmokeEffect(position: THREE.Vector3, velocity: THREE.Vector3, intensity: number = 1): void {
    const effectName = 'tire-smoke';
    
    if (!this.effects.has(effectName)) {
      this.initializeTireSmokeSystem();
    }

    // Add new smoke particles
    const smokeParticles = this.particles.get(effectName) || [];
    const particleCount = Math.floor(intensity * 5);

    for (let i = 0; i < particleCount; i++) {
      const particle: ParticleEffect = {
        name: effectName,
        position: position.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.2,
          (Math.random() - 0.5) * 0.5
        )),
        velocity: velocity.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 1 + 0.5,
          (Math.random() - 0.5) * 2
        )),
        life: 0,
        maxLife: 2 + Math.random() * 1.5, // 2-3.5 seconds
        size: 0.1 + Math.random() * 0.2,
        color: new THREE.Color().setHSL(0, 0, 0.3 + Math.random() * 0.3), // Gray smoke
        opacity: 0.8
      };
      
      smokeParticles.push(particle);
    }

    // Keep particle count manageable
    if (smokeParticles.length > this.maxParticles / 4) {
      smokeParticles.splice(0, smokeParticles.length - this.maxParticles / 4);
    }

    this.particles.set(effectName, smokeParticles);
  }

  public createExhaustEffect(position: THREE.Vector3, velocity: THREE.Vector3): void {
    const effectName = 'exhaust';
    
    if (!this.effects.has(effectName)) {
      this.initializeExhaustSystem();
    }

    // Add new exhaust particles
    const exhaustParticles = this.particles.get(effectName) || [];
    
    for (let i = 0; i < 3; i++) {
      const particle: ParticleEffect = {
        name: effectName,
        position: position.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.2
        )),
        velocity: velocity.clone().multiplyScalar(-0.5).add(new THREE.Vector3(
          (Math.random() - 0.5) * 1,
          Math.random() * 0.5,
          (Math.random() - 0.5) * 1
        )),
        life: 0,
        maxLife: 1 + Math.random() * 0.5, // 1-1.5 seconds
        size: 0.05 + Math.random() * 0.1,
        color: new THREE.Color().setHSL(0, 0, 0.1 + Math.random() * 0.2), // Dark exhaust
        opacity: 0.6
      };
      
      exhaustParticles.push(particle);
    }

    // Keep particle count manageable
    if (exhaustParticles.length > this.maxParticles / 4) {
      exhaustParticles.splice(0, exhaustParticles.length - this.maxParticles / 4);
    }

    this.particles.set(effectName, exhaustParticles);
  }

  public createSparkEffect(position: THREE.Vector3, normal: THREE.Vector3): void {
    const effectName = 'sparks';
    
    if (!this.effects.has(effectName)) {
      this.initializeSparkSystem();
    }

    // Add new spark particles
    const sparkParticles = this.particles.get(effectName) || [];
    
    for (let i = 0; i < 8; i++) {
      const particle: ParticleEffect = {
        name: effectName,
        position: position.clone(),
        velocity: normal.clone().multiplyScalar(2 + Math.random() * 3).add(new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 2,
          (Math.random() - 0.5) * 4
        )),
        life: 0,
        maxLife: 0.3 + Math.random() * 0.2, // 0.3-0.5 seconds
        size: 0.02 + Math.random() * 0.03,
        color: new THREE.Color().setHSL(0.1, 1, 0.7 + Math.random() * 0.3), // Orange sparks
        opacity: 1.0
      };
      
      sparkParticles.push(particle);
    }

    // Keep particle count manageable
    if (sparkParticles.length > this.maxParticles / 4) {
      sparkParticles.splice(0, sparkParticles.length - this.maxParticles / 4);
    }

    this.particles.set(effectName, sparkParticles);
  }

  public createDustEffect(position: THREE.Vector3, velocity: THREE.Vector3): void {
    const effectName = 'dust';
    
    if (!this.effects.has(effectName)) {
      this.initializeDustSystem();
    }

    // Add new dust particles
    const dustParticles = this.particles.get(effectName) || [];
    
    for (let i = 0; i < 4; i++) {
      const particle: ParticleEffect = {
        name: effectName,
        position: position.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          Math.random() * 0.1,
          (Math.random() - 0.5) * 0.8
        )),
        velocity: velocity.clone().multiplyScalar(0.3).add(new THREE.Vector3(
          (Math.random() - 0.5) * 1,
          Math.random() * 0.8,
          (Math.random() - 0.5) * 1
        )),
        life: 0,
        maxLife: 1.5 + Math.random() * 1, // 1.5-2.5 seconds
        size: 0.08 + Math.random() * 0.15,
        color: new THREE.Color().setHSL(0.1, 0.3, 0.6 + Math.random() * 0.2), // Dusty brown
        opacity: 0.5
      };
      
      dustParticles.push(particle);
    }

    // Keep particle count manageable
    if (dustParticles.length > this.maxParticles / 4) {
      dustParticles.splice(0, dustParticles.length - this.maxParticles / 4);
    }

    this.particles.set(effectName, dustParticles);
  }

  private initializeTireSmokeSystem(): void {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: 0.3,
      map: this.createSmokeTexture(),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'tire-smoke-particles';
    this.effects.set('tire-smoke', points);
    this.particles.set('tire-smoke', []);
    this.scene.add(points);
  }

  private initializeExhaustSystem(): void {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: 0.2,
      map: this.createSmokeTexture(),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'exhaust-particles';
    this.effects.set('exhaust', points);
    this.particles.set('exhaust', []);
    this.scene.add(points);
  }

  private initializeSparkSystem(): void {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: 0.05,
      map: this.createSparkTexture(),
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'spark-particles';
    this.effects.set('sparks', points);
    this.particles.set('sparks', []);
    this.scene.add(points);
  }

  private initializeDustSystem(): void {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: 0.25,
      map: this.createDustTexture(),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'dust-particles';
    this.effects.set('dust', points);
    this.particles.set('dust', []);
    this.scene.add(points);
  }

  private createSmokeTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Create radial gradient for smoke
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createSparkTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // Create bright spark
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 200, 100, 1)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createDustTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // Create dust particle
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(139, 113, 75, 0.8)');
    gradient.addColorStop(0.7, 'rgba(139, 113, 75, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 113, 75, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  public update(deltaTime: number = 0.016): void {
    // Update all particle systems
    this.effects.forEach((points, effectName) => {
      const particles = this.particles.get(effectName);
      if (!particles) return;

      // Update particle properties
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Update life
        particle.life += deltaTime;
        
        // Remove dead particles
        if (particle.life >= particle.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        
        // Update position
        particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
        
        // Apply gravity and drag
        particle.velocity.y -= 1.0 * deltaTime; // Gravity
        particle.velocity.multiplyScalar(0.98); // Drag
        
        // Update opacity based on life
        const lifeRatio = particle.life / particle.maxLife;
        particle.opacity = Math.max(0, 1 - lifeRatio);
      }

      // Update geometry
      this.updateParticleGeometry(points, particles);
    });
  }

  private updateParticleGeometry(points: THREE.Points, particles: ParticleEffect[]): void {
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    particles.forEach(particle => {
      positions.push(particle.position.x, particle.position.y, particle.position.z);
      colors.push(particle.color.r, particle.color.g, particle.color.b);
      sizes.push(particle.size);
    });

    const geometry = points.geometry as THREE.BufferGeometry;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Update material opacity
    const material = points.material as THREE.PointsMaterial;
    if (particles.length > 0) {
      const avgOpacity = particles.reduce((sum, p) => sum + p.opacity, 0) / particles.length;
      material.opacity = avgOpacity;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.setDrawRange(0, particles.length);
  }

  public dispose(): void {
    this.effects.forEach((points) => {
      this.scene.remove(points);
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
    });
    
    this.effects.clear();
    this.particles.clear();
    
    console.log('ParticleSystem disposed');
  }
}