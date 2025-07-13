// Comprehensive camera system for Business Cat Racing

import * as THREE from 'three';
import {
  CameraMode,
  CameraFollowType,
  type CameraConfig,
  type CameraTarget,
  type CameraState,
  type CameraShakeConfig,
  type CameraTransition,
  type CameraBounds,
  type CameraEvents,
  type CameraPresets,
  type CameraCollisionConfig,
} from '@/types/camera.types';

export class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private state: CameraState;
  private config: CameraConfig;
  private bounds?: CameraBounds;
  private collisionConfig: CameraCollisionConfig;
  private raycaster: THREE.Raycaster;
  private eventListeners: Map<keyof CameraEvents, ((data: any) => void)[]> = new Map();
  
  // Animation and transition properties
  private transitionData?: {
    transition: CameraTransition;
    startTime: number;
    startPosition: THREE.Vector3;
    startRotation: THREE.Euler;
    targetPosition: THREE.Vector3;
    targetRotation: THREE.Euler;
  };

  // Temporary vectors for calculations (reused to avoid garbage collection)
  private tempVector3A = new THREE.Vector3();
  private tempVector3B = new THREE.Vector3();
  private tempEuler = new THREE.Euler();
  private tempQuaternion = new THREE.Quaternion();

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene, initialConfig?: Partial<CameraConfig>) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    
    // Initialize with default configuration
    this.config = this.createDefaultConfig();
    if (initialConfig) {
      this.config = { ...this.config, ...initialConfig };
    }

    this.state = this.createInitialState();
    this.collisionConfig = this.createDefaultCollisionConfig();

    // Apply initial camera settings
    this.updateCameraFromConfig();
  }

  private createDefaultConfig(): CameraConfig {
    return {
      mode: CameraMode.FOLLOW,
      followType: CameraFollowType.BEHIND,
      offset: {
        position: { x: 0, y: 5, z: 10 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      smoothing: {
        position: 0.1,
        rotation: 0.1,
        lookAt: 0.15,
      },
      constraints: {
        minDistance: 3,
        maxDistance: 50,
        minHeight: 1,
        maxHeight: 100,
        enableCollisionDetection: true,
      },
      fov: 75,
      near: 0.1,
      far: 1000,
    };
  }

  private createDefaultCollisionConfig(): CameraCollisionConfig {
    return {
      enabled: true,
      raycastDistance: 1,
      collisionLayers: ['track', 'obstacles'],
      minDistanceFromSurface: 0.5,
      smoothingOnCollision: 0.05,
    };
  }

  private createInitialState(): CameraState {
    return {
      mode: this.config.mode,
      currentTarget: null,
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      lookAtTarget: new THREE.Vector3(),
      isTransitioning: false,
      transitionProgress: 0,
      shake: {
        isActive: false,
        timeRemaining: 0,
        currentIntensity: 0,
        offset: new THREE.Vector3(),
      },
    };
  }

  private updateCameraFromConfig(): void {
    this.camera.fov = this.config.fov;
    this.camera.near = this.config.near;
    this.camera.far = this.config.far;
    this.camera.updateProjectionMatrix();
  }

  public setTarget(target: CameraTarget): void {
    const oldTarget = this.state.currentTarget;
    this.state.currentTarget = target;
    
    this.emit('targetChanged', { from: oldTarget, to: target });
  }

  public clearTarget(): void {
    const oldTarget = this.state.currentTarget;
    this.state.currentTarget = null;
    
    this.emit('targetChanged', { from: oldTarget, to: null });
  }

  public setMode(mode: CameraMode, followType?: CameraFollowType): void {
    const oldMode = this.state.mode;
    this.state.mode = mode;
    this.config.mode = mode;
    
    if (followType) {
      this.config.followType = followType;
    }

    this.emit('modeChanged', { from: oldMode, to: mode });
  }

  public setConfig(newConfig: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateCameraFromConfig();
  }

  public setBounds(bounds: CameraBounds): void {
    this.bounds = bounds;
  }

  public startShake(shakeConfig: CameraShakeConfig): void {
    this.state.shake = {
      isActive: true,
      timeRemaining: shakeConfig.duration,
      currentIntensity: shakeConfig.intensity,
      offset: new THREE.Vector3(),
    };

    this.emit('shakeStarted', { config: shakeConfig });
  }

  public stopShake(): void {
    if (this.state.shake.isActive) {
      this.state.shake.isActive = false;
      this.state.shake.timeRemaining = 0;
      this.state.shake.currentIntensity = 0;
      this.state.shake.offset.set(0, 0, 0);
      
      this.emit('shakeEnded', undefined);
    }
  }

  public transitionTo(targetConfig: Partial<CameraConfig>, duration: number = 1000, easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' = 'easeOut'): void {
    const fromConfig = { ...this.config };
    const toConfig = { ...this.config, ...targetConfig };

    const transition: CameraTransition = {
      fromConfig,
      toConfig,
      duration,
      easing,
    };

    this.transitionData = {
      transition,
      startTime: performance.now(),
      startPosition: this.camera.position.clone(),
      startRotation: this.camera.rotation.clone(),
      targetPosition: new THREE.Vector3(),
      targetRotation: new THREE.Euler(),
    };

    this.state.isTransitioning = true;
    this.state.transitionProgress = 0;

    this.emit('transitionStarted', { transition });
  }

  public update(deltaTime: number = 0.016): void {
    // Update transitions
    if (this.state.isTransitioning) {
      this.updateTransition(deltaTime);
    }

    // Update camera shake
    if (this.state.shake.isActive) {
      this.updateShake(deltaTime);
    }

    // Update camera position based on current mode and target
    this.updateCameraPosition(deltaTime);

    // Apply collision detection if enabled
    if (this.config.constraints.enableCollisionDetection && this.collisionConfig.enabled) {
      this.handleCollisions();
    }

    // Constrain camera within bounds
    if (this.bounds) {
      this.constrainToBounds();
    }

    // Apply final position and rotation to camera
    this.applyCameraTransform();
  }

  private updateTransition(_deltaTime: number = 0.016): void {
    if (!this.transitionData) return;

    const elapsed = performance.now() - this.transitionData.startTime;
    const progress = Math.min(elapsed / this.transitionData.transition.duration, 1);

    // Apply easing
    const easedProgress = this.applyEasing(progress, this.transitionData.transition.easing);
    this.state.transitionProgress = easedProgress;

    // Interpolate configuration values
    this.interpolateConfig(this.transitionData.transition.fromConfig, this.transitionData.transition.toConfig, easedProgress);

    if (progress >= 1) {
      // Transition complete
      this.state.isTransitioning = false;
      this.state.transitionProgress = 1;
      this.config = { ...this.transitionData.transition.toConfig };
      
      const transition = this.transitionData.transition;
      this.transitionData = undefined;
      
      this.emit('transitionCompleted', { transition });
      
      if (transition.onComplete) {
        transition.onComplete();
      }
    }
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return 1 - (1 - t) * (1 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default:
        return t;
    }
  }

  private interpolateConfig(from: CameraConfig, to: CameraConfig, t: number): void {
    // Interpolate numerical values
    this.config.fov = THREE.MathUtils.lerp(from.fov, to.fov, t);
    this.config.smoothing.position = THREE.MathUtils.lerp(from.smoothing.position, to.smoothing.position, t);
    this.config.smoothing.rotation = THREE.MathUtils.lerp(from.smoothing.rotation, to.smoothing.rotation, t);
    this.config.smoothing.lookAt = THREE.MathUtils.lerp(from.smoothing.lookAt, to.smoothing.lookAt, t);

    // Interpolate offsets
    this.config.offset.position.x = THREE.MathUtils.lerp(from.offset.position.x, to.offset.position.x, t);
    this.config.offset.position.y = THREE.MathUtils.lerp(from.offset.position.y, to.offset.position.y, t);
    this.config.offset.position.z = THREE.MathUtils.lerp(from.offset.position.z, to.offset.position.z, t);

    // Update camera properties
    this.updateCameraFromConfig();
  }

  private updateShake(deltaTime: number = 0.016): void {
    if (!this.state.shake.isActive) return;

    this.state.shake.timeRemaining -= deltaTime * 1000; // Convert to milliseconds

    if (this.state.shake.timeRemaining <= 0) {
      this.stopShake();
      return;
    }

    // Generate shake offset
    const intensity = this.state.shake.currentIntensity;
    this.state.shake.offset.set(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity
    );

    // Decay shake intensity over time
    this.state.shake.currentIntensity *= 0.95;
  }

  private updateCameraPosition(_deltaTime: number = 0.016): void {
    if (!this.state.currentTarget) {
      return;
    }

    const target = this.state.currentTarget.object3D;
    const targetPosition = target.position;
    const targetRotation = target.rotation;

    // Calculate desired camera position based on mode and follow type
    const desiredPosition = this.calculateDesiredPosition(targetPosition, targetRotation);
    const desiredLookAt = this.calculateDesiredLookAt(targetPosition, targetRotation);

    // Apply smoothing
    this.state.position.lerp(desiredPosition, this.config.smoothing.position);
    this.state.lookAtTarget.lerp(desiredLookAt, this.config.smoothing.lookAt);

    // Calculate rotation to look at target
    this.tempVector3A.subVectors(this.state.lookAtTarget, this.state.position).normalize();
    this.tempEuler.setFromQuaternion(
      this.tempQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), this.tempVector3A)
    );

    // Smooth rotation
    this.state.rotation.x = THREE.MathUtils.lerp(this.state.rotation.x, this.tempEuler.x, this.config.smoothing.rotation);
    this.state.rotation.y = THREE.MathUtils.lerp(this.state.rotation.y, this.tempEuler.y, this.config.smoothing.rotation);
    this.state.rotation.z = THREE.MathUtils.lerp(this.state.rotation.z, this.tempEuler.z, this.config.smoothing.rotation);
  }

  private calculateDesiredPosition(targetPosition: THREE.Vector3, targetRotation: THREE.Euler): THREE.Vector3 {
    const offset = this.config.offset.position;
    const position = this.tempVector3A;

    switch (this.config.followType) {
      case CameraFollowType.BEHIND:
        // Position camera behind the target
        position.set(0, offset.y, offset.z);
        position.applyEuler(targetRotation);
        position.add(targetPosition);
        break;

      case CameraFollowType.CHASE:
        // Similar to behind but with some anticipation based on velocity
        position.set(0, offset.y, offset.z);
        if (this.state.currentTarget?.velocity) {
          // Add velocity-based anticipation
          const velocityInfluence = 0.5;
          this.tempVector3B.copy(this.state.currentTarget.velocity).multiplyScalar(velocityInfluence);
          position.add(this.tempVector3B);
        }
        position.applyEuler(targetRotation);
        position.add(targetPosition);
        break;

      case CameraFollowType.OVERHEAD_VIEW:
        // Position camera above the target
        position.copy(targetPosition);
        position.y += Math.abs(offset.y);
        position.x += offset.x;
        position.z += offset.z;
        break;

      case CameraFollowType.SIDE_VIEW:
        // Position camera to the side of the target
        position.set(offset.x, offset.y, 0);
        position.applyEuler(targetRotation);
        position.add(targetPosition);
        break;

      case CameraFollowType.ORBIT:
        // Orbit around the target (would need additional orbital parameters)
        const time = performance.now() * 0.001;
        const radius = Math.sqrt(offset.x * offset.x + offset.z * offset.z);
        position.set(
          Math.cos(time * 0.5) * radius,
          offset.y,
          Math.sin(time * 0.5) * radius
        );
        position.add(targetPosition);
        break;

      default:
        position.copy(targetPosition).add(new THREE.Vector3(offset.x, offset.y, offset.z));
        break;
    }

    return position;
  }

  private calculateDesiredLookAt(targetPosition: THREE.Vector3, targetRotation: THREE.Euler): THREE.Vector3 {
    const lookAt = this.tempVector3B;

    switch (this.config.followType) {
      case CameraFollowType.OVERHEAD_VIEW:
        // Look at the target position
        lookAt.copy(targetPosition);
        break;

      case CameraFollowType.BEHIND:
      case CameraFollowType.CHASE:
        // Look ahead of the target
        lookAt.set(0, 0, -10); // Look forward
        lookAt.applyEuler(targetRotation);
        lookAt.add(targetPosition);
        break;

      default:
        lookAt.copy(targetPosition);
        break;
    }

    return lookAt;
  }

  private handleCollisions(): void {
    if (!this.state.currentTarget) return;

    const targetPosition = this.state.currentTarget.object3D.position;
    const cameraPosition = this.state.position;

    // Cast ray from target to camera position
    this.raycaster.set(targetPosition, this.tempVector3A.subVectors(cameraPosition, targetPosition).normalize());

    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    for (const intersect of intersects) {
      if (intersect.object !== this.state.currentTarget.object3D && intersect.distance < targetPosition.distanceTo(cameraPosition)) {
        // Collision detected, move camera closer to target
        const collisionPoint = intersect.point;
        const normal = intersect.face?.normal || new THREE.Vector3(0, 1, 0);
        
        // Position camera at collision point with offset
        this.tempVector3B.copy(normal).multiplyScalar(this.collisionConfig.minDistanceFromSurface);
        this.state.position.copy(collisionPoint).add(this.tempVector3B);
        
        this.emit('collisionDetected', { 
          position: { x: collisionPoint.x, y: collisionPoint.y, z: collisionPoint.z },
          normal: { x: normal.x, y: normal.y, z: normal.z }
        });
        break;
      }
    }
  }

  private constrainToBounds(): void {
    if (!this.bounds) return;

    this.state.position.x = THREE.MathUtils.clamp(this.state.position.x, this.bounds.min.x, this.bounds.max.x);
    this.state.position.y = THREE.MathUtils.clamp(this.state.position.y, this.bounds.min.y, this.bounds.max.y);
    this.state.position.z = THREE.MathUtils.clamp(this.state.position.z, this.bounds.min.z, this.bounds.max.z);
  }

  private applyCameraTransform(): void {
    // Apply position
    this.camera.position.copy(this.state.position);

    // Apply shake offset if active
    if (this.state.shake.isActive) {
      this.camera.position.add(this.state.shake.offset);
    }

    // Apply rotation (look at target)
    this.camera.lookAt(this.state.lookAtTarget);
  }

  // Preset configurations for common camera setups
  public static createKartRacingPresets(): CameraPresets['kartRacing'] {
    return {
      chase: {
        mode: CameraMode.FOLLOW,
        followType: CameraFollowType.CHASE,
        offset: {
          position: { x: 0, y: 3, z: 8 },
          rotation: { x: 0, y: 0, z: 0 },
        },
        smoothing: {
          position: 0.08,
          rotation: 0.1,
          lookAt: 0.12,
        },
        constraints: {
          minDistance: 3,
          maxDistance: 15,
          minHeight: 1,
          maxHeight: 20,
          enableCollisionDetection: true,
        },
        fov: 75,
        near: 0.1,
        far: 1000,
      },
      cockpit: {
        mode: CameraMode.FOLLOW,
        followType: CameraFollowType.BEHIND,
        offset: {
          position: { x: 0, y: 0.5, z: 0.5 },
          rotation: { x: 0, y: 0, z: 0 },
        },
        smoothing: {
          position: 0.3,
          rotation: 0.3,
          lookAt: 0.4,
        },
        constraints: {
          minDistance: 0.5,
          maxDistance: 2,
          minHeight: 0.3,
          maxHeight: 3,
          enableCollisionDetection: false,
        },
        fov: 85,
        near: 0.01,
        far: 1000,
      },
      overhead: {
        mode: CameraMode.FOLLOW,
        followType: CameraFollowType.OVERHEAD_VIEW,
        offset: {
          position: { x: 0, y: 20, z: 0 },
          rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        },
        smoothing: {
          position: 0.05,
          rotation: 0.05,
          lookAt: 0.1,
        },
        constraints: {
          minDistance: 10,
          maxDistance: 50,
          minHeight: 10,
          maxHeight: 100,
          enableCollisionDetection: false,
        },
        fov: 60,
        near: 0.1,
        far: 1000,
      },
      cinematic: {
        mode: CameraMode.CINEMATIC,
        followType: CameraFollowType.ORBIT,
        offset: {
          position: { x: 5, y: 3, z: 5 },
          rotation: { x: 0, y: 0, z: 0 },
        },
        smoothing: {
          position: 0.02,
          rotation: 0.02,
          lookAt: 0.05,
        },
        constraints: {
          minDistance: 3,
          maxDistance: 30,
          minHeight: 1,
          maxHeight: 50,
          enableCollisionDetection: true,
        },
        fov: 70,
        near: 0.1,
        far: 1000,
      },
    };
  }

  // Event system
  public on<K extends keyof CameraEvents>(event: K, callback: (data: CameraEvents[K]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off<K extends keyof CameraEvents>(event: K, callback: (data: CameraEvents[K]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof CameraEvents>(event: K, data: CameraEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Getters
  public getState(): Readonly<CameraState> {
    return this.state;
  }

  public getConfig(): Readonly<CameraConfig> {
    return this.config;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public dispose(): void {
    this.eventListeners.clear();
    this.stopShake();
    this.state.isTransitioning = false;
    this.transitionData = undefined;
  }
}