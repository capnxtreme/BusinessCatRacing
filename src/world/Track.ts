// Track creation and management system

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { PhysicsWorld } from '@/engine/PhysicsWorld';

export interface TrackConfig {
  name: string;
  length: number;
  width: number;
  difficulty: 'easy' | 'medium' | 'hard';
  theme: 'corporate' | 'city' | 'nature';
}

export class Track {
  private scene: THREE.Scene;
  private physics: PhysicsWorld;
  private trackGroup: THREE.Group;
  private trackBodies: CANNON.Body[] = [];

  constructor(scene: THREE.Scene, physics: PhysicsWorld, _config: TrackConfig) {
    this.scene = scene;
    this.physics = physics;
    this.trackGroup = new THREE.Group();
    this.trackGroup.name = 'track';
  }

  public createOvalTrack(): void {
    // Clear existing track
    this.clearTrack();

    // Create Mario Kart style circuit instead of basic oval
    this.createMarioKartCircuit();

    // Add track group to scene
    this.scene.add(this.trackGroup);
  }

  private createMarioKartCircuit(): void {
    // Track parameters optimized for Mario Kart feel
    const trackWidth = 12; // Wider for multiple karts
    const wallHeight = 3;
    
    // Create the main circuit layout
    const trackPath = this.generateMarioKartTrackPath();
    
    // Create track surface with racing lines
    this.createCircuitSurface(trackPath, trackWidth);
    
    // Create proper barriers
    this.createCircuitBarriers(trackPath, trackWidth, wallHeight);
    
    // Create environment
    this.createCircuitEnvironment(trackPath, trackWidth);
    
    // Create start/finish straight with proper markings
    this.createStartFinishArea(trackPath, trackWidth);
    
    // Add decorative elements
    this.addMarioKartDecorations(trackPath, trackWidth);
  }

  private generateMarioKartTrackPath(): THREE.Vector2[] {
    // Create a classic Mario Kart circuit with interesting corners
    const path: THREE.Vector2[] = [];
    const scale = 35; // Scale factor for track size
    
    // Define key points for a Mario Kart style circuit
    // Start/finish straight
    path.push(new THREE.Vector2(scale, 0));
    path.push(new THREE.Vector2(scale * 0.8, 0));
    path.push(new THREE.Vector2(scale * 0.6, 0));
    
    // First turn - wide sweeping right
    path.push(new THREE.Vector2(scale * 0.4, scale * 0.2));
    path.push(new THREE.Vector2(scale * 0.2, scale * 0.5));
    path.push(new THREE.Vector2(scale * 0.1, scale * 0.8));
    
    // Top straight with slight curve
    path.push(new THREE.Vector2(-scale * 0.1, scale * 0.9));
    path.push(new THREE.Vector2(-scale * 0.3, scale * 0.95));
    path.push(new THREE.Vector2(-scale * 0.6, scale * 0.9));
    
    // Sharp chicane section (Mario Kart signature)
    path.push(new THREE.Vector2(-scale * 0.8, scale * 0.7));
    path.push(new THREE.Vector2(-scale * 0.9, scale * 0.4));
    path.push(new THREE.Vector2(-scale * 0.8, scale * 0.1));
    path.push(new THREE.Vector2(-scale * 0.7, -scale * 0.1));
    
    // Hairpin turn
    path.push(new THREE.Vector2(-scale * 0.5, -scale * 0.4));
    path.push(new THREE.Vector2(-scale * 0.2, -scale * 0.6));
    path.push(new THREE.Vector2(scale * 0.1, -scale * 0.7));
    path.push(new THREE.Vector2(scale * 0.4, -scale * 0.6));
    
    // Final section leading back to start
    path.push(new THREE.Vector2(scale * 0.7, -scale * 0.4));
    path.push(new THREE.Vector2(scale * 0.9, -scale * 0.2));
    
    // Smooth the path for better racing feel
    return this.smoothTrackPath(path);
  }

  private smoothTrackPath(path: THREE.Vector2[]): THREE.Vector2[] {
    const smoothedPath: THREE.Vector2[] = [];
    const resolution = 3; // Points between each control point
    
    for (let i = 0; i < path.length; i++) {
      const current = path[i];
      const next = path[(i + 1) % path.length];
      
      smoothedPath.push(current.clone());
      
      // Add interpolated points for smooth curves
      for (let j = 1; j < resolution; j++) {
        const t = j / resolution;
        const interpolated = new THREE.Vector2(
          current.x + (next.x - current.x) * t,
          current.y + (next.y - current.y) * t
        );
        smoothedPath.push(interpolated);
      }
    }
    
    return smoothedPath;
  }

  private createCircuitSurface(path: THREE.Vector2[], width: number): void {
    // Create track surface geometry following the path
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    
    const halfWidth = width / 2;
    
    // Generate track surface along the path
    for (let i = 0; i < path.length; i++) {
      const current = path[i];
      const next = path[(i + 1) % path.length];
      
      // Calculate direction vector
      const direction = new THREE.Vector2(next.x - current.x, next.y - current.y).normalize();
      // Calculate perpendicular vector (for track width)
      const perpendicular = new THREE.Vector2(-direction.y, direction.x);
      
      // Create left and right edge points
      const leftPoint = current.clone().add(perpendicular.clone().multiplyScalar(halfWidth));
      const rightPoint = current.clone().add(perpendicular.clone().multiplyScalar(-halfWidth));
      
      // Add vertices (left side, right side)
      vertices.push(leftPoint.x, 0, leftPoint.y);
      vertices.push(rightPoint.x, 0, rightPoint.y);
      
      // Add UVs for texture mapping
      const u = i / path.length;
      uvs.push(u, 0); // Left UV
      uvs.push(u, 1); // Right UV
    }
    
    // Create triangular faces
    for (let i = 0; i < path.length; i++) {
      const current = i * 2;
      const next = ((i + 1) % path.length) * 2;
      
      // Two triangles per segment
      indices.push(current, current + 1, next);
      indices.push(current + 1, next + 1, next);
    }
    
    // Create geometry
    const trackGeometry = new THREE.BufferGeometry();
    trackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    trackGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    trackGeometry.setIndex(indices);
    trackGeometry.computeVertexNormals();
    
    // Create Mario Kart style asphalt material
    const trackMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2a2a, // Dark asphalt
      shininess: 8,
      map: this.createMarioKartAsphaltTexture(),
    });
    
    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    trackMesh.receiveShadow = true;
    trackMesh.name = 'circuit-surface';
    this.trackGroup.add(trackMesh);
    
    // Create physics body - simplified box for performance
    const bounds = this.calculateTrackBounds(path, width);
    const trackShape = new CANNON.Box(new CANNON.Vec3(bounds.width / 2, 0.1, bounds.height / 2));
    const trackBody = new CANNON.Body({ mass: 0 });
    trackBody.addShape(trackShape);
    trackBody.position.set(bounds.centerX, -0.1, bounds.centerY);
    trackBody.material = new CANNON.Material('track');
    trackBody.material.friction = 1.2; // Good grip for racing
    
    this.physics.addBody('circuit-surface', trackBody, trackMesh, 'track');
    this.trackBodies.push(trackBody);
  }

  private calculateTrackBounds(path: THREE.Vector2[], width: number): { 
    width: number; 
    height: number; 
    centerX: number; 
    centerY: number; 
  } {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    path.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
    
    // Add track width padding
    const padding = width;
    return {
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2,
      centerX: (maxX + minX) / 2,
      centerY: (maxY + minY) / 2
    };
  }

  private createCircuitBarriers(path: THREE.Vector2[], width: number, height: number): void {
    // Mario Kart style colorful barriers
    const barrierMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4444, // Red barrier color (Mario Kart style)
      shininess: 15,
    });
    
    const alternateBarrierMaterial = new THREE.MeshPhongMaterial({
      color: 0x4444ff, // Blue alternate barrier
      shininess: 15,
    });
    
    // Create barriers along both sides of the track
    this.createSideBarriers(path, width, height, barrierMaterial, alternateBarrierMaterial, 'left');
    this.createSideBarriers(path, width, height, barrierMaterial, alternateBarrierMaterial, 'right');
  }
  
  private createSideBarriers(
    path: THREE.Vector2[], 
    width: number, 
    height: number, 
    material1: THREE.Material, 
    material2: THREE.Material, 
    side: 'left' | 'right'
  ): void {
    const halfWidth = width / 2;
    const barrierOffset = side === 'left' ? halfWidth + 1 : -(halfWidth + 1);
    const barrierWidth = 2;
    // Barrier segments are placed at regular intervals
    
    for (let i = 0; i < path.length; i += 3) {
      const current = path[i];
      const next = path[(i + 1) % path.length];
      
      // Calculate direction and perpendicular
      const direction = new THREE.Vector2(next.x - current.x, next.y - current.y).normalize();
      const perpendicular = new THREE.Vector2(-direction.y, direction.x);
      
      // Position barrier
      const barrierPosition = current.clone().add(perpendicular.clone().multiplyScalar(barrierOffset));
      
      // Create barrier segment
      const barrierGeometry = new THREE.BoxGeometry(barrierWidth, height, barrierWidth);
      const material = (Math.floor(i / 6) % 2 === 0) ? material1 : material2; // Alternate colors
      const barrierMesh = new THREE.Mesh(barrierGeometry, material);
      
      barrierMesh.position.set(barrierPosition.x, height / 2, barrierPosition.y);
      barrierMesh.castShadow = true;
      barrierMesh.name = `barrier-${side}-${i}`;
      this.trackGroup.add(barrierMesh);
      
      // Create physics body
      const barrierShape = new CANNON.Box(new CANNON.Vec3(barrierWidth / 2, height / 2, barrierWidth / 2));
      const barrierBody = new CANNON.Body({ mass: 0 });
      barrierBody.addShape(barrierShape);
      barrierBody.position.set(barrierPosition.x, height / 2, barrierPosition.y);
      barrierBody.material = new CANNON.Material('barrier');
      barrierBody.material.restitution = 0.4; // Bouncy for Mario Kart feel
      
      this.physics.addBody(`barrier-${side}-${i}`, barrierBody, barrierMesh, 'static');
      this.trackBodies.push(barrierBody);
    }
  }

  private createCircuitEnvironment(path: THREE.Vector2[], trackWidth: number): void {
    // Calculate bounds for environment
    const bounds = this.calculateTrackBounds(path, trackWidth);
    
    // Create vibrant Mario Kart style grass
    const grassMaterial = new THREE.MeshLambertMaterial({
      color: 0x32cd32, // Bright green
      map: this.createMarioKartGrassTexture(),
    });
    
    // Create main grass field
    const grassSize = Math.max(bounds.width, bounds.height) + 40;
    const grassGeometry = new THREE.PlaneGeometry(grassSize, grassSize);
    const grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.position.set(bounds.centerX, -0.02, bounds.centerY);
    grassMesh.receiveShadow = true;
    grassMesh.name = 'circuit-grass';
    this.trackGroup.add(grassMesh);
    
    // Add some decorative hills/mounds around the track
    this.addEnvironmentHills(bounds);
  }

  private addEnvironmentHills(bounds: { centerX: number; centerY: number; width: number; height: number }): void {
    const hillMaterial = new THREE.MeshLambertMaterial({
      color: 0x228b22, // Darker green for hills
    });
    
    // Create several decorative hills
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = Math.max(bounds.width, bounds.height) / 2 + 20;
      const x = bounds.centerX + Math.cos(angle) * distance;
      const z = bounds.centerY + Math.sin(angle) * distance;
      
      const hillGeometry = new THREE.SphereGeometry(
        5 + Math.random() * 8, // Random size
        16, 8
      );
      const hillMesh = new THREE.Mesh(hillGeometry, hillMaterial);
      hillMesh.position.set(x, 2, z);
      hillMesh.scale.y = 0.5; // Flatten to make hills
      hillMesh.receiveShadow = true;
      hillMesh.name = `hill-${i}`;
      this.trackGroup.add(hillMesh);
    }
  }

  private createStartFinishArea(path: THREE.Vector2[], width: number): void {
    // Find the start/finish position (first point on path)
    const startPoint = path[0];
    const nextPoint = path[1];
    const direction = new THREE.Vector2(nextPoint.x - startPoint.x, nextPoint.y - startPoint.y).normalize();
    const perpendicular = new THREE.Vector2(-direction.y, direction.x);
    
    // Create wider start/finish straight
    const lineGeometry = new THREE.PlaneGeometry(width + 2, 4);
    const lineMaterial = new THREE.MeshPhongMaterial({
      map: this.createCheckeredTexture(),
      transparent: true,
    });
    
    const startLine = new THREE.Mesh(lineGeometry, lineMaterial);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(startPoint.x, 0.01, startPoint.y);
    
    // Rotate to align with track direction
    const angle = Math.atan2(direction.y, direction.x);
    startLine.rotation.y = angle;
    startLine.name = 'start-finish-line';
    this.trackGroup.add(startLine);
    
    // Add start position markers
    this.createStartingGrid(startPoint, direction, perpendicular, width);
  }

  private createStartingGrid(
    startPoint: THREE.Vector2, 
    direction: THREE.Vector2, 
    perpendicular: THREE.Vector2, 
    trackWidth: number
  ): void {
    // Create starting positions for karts
    const gridMaterial = new THREE.MeshPhongMaterial({
      color: 0xffff00, // Yellow grid lines
      transparent: true,
      opacity: 0.8,
    });
    
    // Create 4 starting positions (2x2 grid)
    const positions = [
      { x: -trackWidth * 0.25, z: -6 }, // Front left
      { x: trackWidth * 0.25, z: -6 },  // Front right
      { x: -trackWidth * 0.25, z: -10 }, // Back left
      { x: trackWidth * 0.25, z: -10 },  // Back right
    ];
    
    positions.forEach((pos, index) => {
      const gridGeometry = new THREE.PlaneGeometry(3, 5);
      const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
      
      // Position relative to start point and track direction
      const localPos = perpendicular.clone().multiplyScalar(pos.x)
        .add(direction.clone().multiplyScalar(pos.z));
      const worldPos = startPoint.clone().add(localPos);
      
      gridMesh.rotation.x = -Math.PI / 2;
      gridMesh.position.set(worldPos.x, 0.005, worldPos.y);
      
      const angle = Math.atan2(direction.y, direction.x);
      gridMesh.rotation.z = angle;
      gridMesh.name = `grid-position-${index}`;
      this.trackGroup.add(gridMesh);
    });
  }

  private addMarioKartDecorations(path: THREE.Vector2[], trackWidth: number): void {
    // Add Mario Kart style decorative elements
    this.addTrackSidePowerUps(path, trackWidth);
    this.addDecorationFlags(path, trackWidth);
  }

  private addTrackSidePowerUps(path: THREE.Vector2[], trackWidth: number): void {
    // Add colorful decoration blocks along the track
    const decorationMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6600, // Orange decoration blocks
    });
    
    // Place decorations at strategic points
    const decorationPositions = [
      Math.floor(path.length * 0.25), // After first turn
      Math.floor(path.length * 0.5),  // Halfway point
      Math.floor(path.length * 0.75), // After hairpin
    ];
    
    decorationPositions.forEach((pathIndex, index) => {
      const point = path[pathIndex];
      const nextPoint = path[(pathIndex + 1) % path.length];
      const direction = new THREE.Vector2(nextPoint.x - point.x, nextPoint.y - point.y).normalize();
      const perpendicular = new THREE.Vector2(-direction.y, direction.x);
      
      // Place on outside of track
      const decorationPos = point.clone().add(perpendicular.clone().multiplyScalar(-(trackWidth / 2 + 5)));
      
      const decorationGeometry = new THREE.BoxGeometry(2, 3, 2);
      const decorationMesh = new THREE.Mesh(decorationGeometry, decorationMaterial);
      decorationMesh.position.set(decorationPos.x, 1.5, decorationPos.y);
      decorationMesh.castShadow = true;
      decorationMesh.name = `decoration-${index}`;
      this.trackGroup.add(decorationMesh);
    });
  }

  private addDecorationFlags(path: THREE.Vector2[], trackWidth: number): void {
    // Add colorful flags around the track
    const flagMaterial = new THREE.MeshLambertMaterial({
      color: 0xff1493, // Pink flags
      side: THREE.DoubleSide,
    });
    
    // Place flags at regular intervals
    for (let i = 0; i < path.length; i += 8) {
      const point = path[i];
      const nextPoint = path[(i + 1) % path.length];
      const direction = new THREE.Vector2(nextPoint.x - point.x, nextPoint.y - point.y).normalize();
      const perpendicular = new THREE.Vector2(-direction.y, direction.x);
      
      // Alternate sides
      const side = (i / 8) % 2 === 0 ? 1 : -1;
      const flagPos = point.clone().add(perpendicular.clone().multiplyScalar(side * (trackWidth / 2 + 8)));
      
      // Flag pole
      const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6);
      const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
      poleMesh.position.set(flagPos.x, 3, flagPos.y);
      this.trackGroup.add(poleMesh);
      
      // Flag
      const flagGeometry = new THREE.PlaneGeometry(2, 1.5);
      const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
      flagMesh.position.set(flagPos.x + 1, 5, flagPos.y);
      this.trackGroup.add(flagMesh);
    }
  }

  private createMarioKartAsphaltTexture(): THREE.Texture {
    // Create Mario Kart style asphalt with racing lines
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base asphalt color - lighter for Mario Kart feel
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add asphalt texture variation
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 2 + 1;
      const gray = Math.floor(Math.random() * 30 + 30);
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.fillRect(x, y, size, size);
    }
    
    // Add racing lines (Mario Kart style)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.lineCap = 'round';
    
    // Center dashed line
    ctx.beginPath();
    ctx.moveTo(0, 256);
    ctx.lineTo(512, 256);
    ctx.stroke();
    
    // Racing line guide (curved)
    ctx.strokeStyle = '#ffaa00'; // Orange racing line
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.quadraticCurveTo(256, 180, 512, 200);
    ctx.stroke();
    
    // Edge markings
    ctx.setLineDash([]);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ffff00'; // Yellow edge lines
    
    // Top edge
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(512, 40);
    ctx.stroke();
    
    // Bottom edge
    ctx.beginPath();
    ctx.moveTo(0, 472);
    ctx.lineTo(512, 472);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    
    return texture;
  }

  private createMarioKartGrassTexture(): THREE.Texture {
    // Create vibrant Mario Kart style grass
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Base bright green
    ctx.fillStyle = '#32cd32';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add grass variation with more vibrant colors
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 2 + 1;
      const green = Math.floor(Math.random() * 60 + 120);
      const variation = Math.random() * 20 - 10;
      ctx.fillStyle = `rgb(${Math.max(0, variation)}, ${green}, ${Math.max(0, variation / 2)})`;
      ctx.fillRect(x, y, size, size);
    }
    
    // Add some flower spots (Mario Kart style)
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      
      // Random flower colors
      const colors = ['#ff69b4', '#ffff00', '#ff0000', '#0000ff', '#ffffff'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    
    return texture;
  }

  // Note: createAsphaltTexture and createGrassTexture are available as fallback methods
  // but not currently used as we directly call Mario Kart specific methods

  private createCheckeredTexture(): THREE.Texture {
    // Create checkered flag pattern
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    const checkSize = 8;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const isBlack = (x + y) % 2 === 0;
        ctx.fillStyle = isBlack ? '#000000' : '#ffffff';
        ctx.fillRect(x * checkSize, y * checkSize, checkSize, checkSize);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }

  private clearTrack(): void {
    // Remove existing track from scene
    this.scene.remove(this.trackGroup);
    
    // Clear physics bodies would be handled by PhysicsWorld
    this.trackBodies = [];
    
    // Clear track group
    this.trackGroup.clear();
  }

  public getStartPosition(): { x: number; y: number; z: number } {
    // Return starting position on the Mario Kart circuit
    // Position is at the start of the generated track path
    const scale = 35;
    return { x: scale, y: 2, z: 0 };
  }

  public getStartRotation(): { x: number; y: number; z: number } {
    // Return starting rotation facing along the track direction
    // The track starts going in the negative X direction (left)
    return { x: 0, y: Math.PI, z: 0 };
  }

  public dispose(): void {
    this.clearTrack();
    console.log('Track disposed');
  }
}