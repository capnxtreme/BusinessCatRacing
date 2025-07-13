// Dynamic camera controller for racing game feel

import * as THREE from 'three';
import type { Kart } from '@/entities/Kart';

export enum CameraMode {
  FOLLOW = 'follow',
  CHASE = 'chase',
  COCKPIT = 'cockpit',
  OVERHEAD = 'overhead'
}

export interface CameraConfig {
  mode: CameraMode;
  distance: number;
  height: number;
  lookAhead: number;
  smoothing: number;
  fov: number;
}

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private target: Kart;
  private config: CameraConfig;
  
  // Camera state
  private currentPosition: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();
  
  // Smooth following
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, target: Kart, config?: Partial<CameraConfig>) {
    this.camera = camera;
    this.target = target;
    
    // Default racing camera config
    this.config = {
      mode: CameraMode.CHASE,
      distance: 8,
      height: 4,
      lookAhead: 2,
      smoothing: 0.1,
      fov: 75,
      ...config
    };
    
    // Apply FOV
    this.camera.fov = this.config.fov;
    this.camera.updateProjectionMatrix();
    
    // Initialize camera position
    this.initializePosition();
  }

  private initializePosition(): void {
    const kartState = this.target.getState();
    
    // Get kart world position
    const kartPosition = new THREE.Vector3(
      kartState.position.x,
      kartState.position.y,
      kartState.position.z
    );
    
    // Initial camera setup based on mode
    switch (this.config.mode) {
      case CameraMode.CHASE:
        this.setupChaseCamera(kartPosition, new THREE.Euler(kartState.rotation.x, kartState.rotation.y, kartState.rotation.z));
        break;
      case CameraMode.FOLLOW:
        this.setupFollowCamera(kartPosition);
        break;
      case CameraMode.OVERHEAD:
        this.setupOverheadCamera(kartPosition);
        break;
      case CameraMode.COCKPIT:
        this.setupCockpitCamera(kartPosition, new THREE.Euler(kartState.rotation.x, kartState.rotation.y, kartState.rotation.z));
        break;
    }
  }

  private setupChaseCamera(kartPosition: THREE.Vector3, kartRotation: THREE.Euler): void {
    // Position camera behind and above the kart
    // Create a backward direction relative to kart's facing direction
    const backwardDirection = new THREE.Vector3(0, 0, 1); // Positive Z is backward in Three.js
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(kartRotation);
    backwardDirection.applyMatrix4(rotationMatrix);
    
    this.targetPosition.copy(kartPosition)
      .add(backwardDirection.multiplyScalar(this.config.distance))
      .add(new THREE.Vector3(0, this.config.height, 0));
    
    this.targetLookAt.copy(kartPosition)
      .add(new THREE.Vector3(0, 1, 0)); // Look slightly above kart
      
    this.currentPosition.copy(this.targetPosition);
    this.currentLookAt.copy(this.targetLookAt);
  }

  private setupFollowCamera(kartPosition: THREE.Vector3): void {
    // Fixed distance follow camera
    this.targetPosition.copy(kartPosition).add(new THREE.Vector3(-this.config.distance, this.config.height, 0));
    this.targetLookAt.copy(kartPosition);
    
    this.currentPosition.copy(this.targetPosition);
    this.currentLookAt.copy(this.targetLookAt);
  }

  private setupOverheadCamera(kartPosition: THREE.Vector3): void {
    // Top-down view
    this.targetPosition.copy(kartPosition).add(new THREE.Vector3(0, 20, 0));
    this.targetLookAt.copy(kartPosition);
    
    this.currentPosition.copy(this.targetPosition);
    this.currentLookAt.copy(this.targetLookAt);
  }

  private setupCockpitCamera(kartPosition: THREE.Vector3, kartRotation: THREE.Euler): void {
    // First-person view from inside kart
    const forwardDirection = new THREE.Vector3(0, 0, -1);
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(kartRotation);
    forwardDirection.applyMatrix4(rotationMatrix);
    
    this.targetPosition.copy(kartPosition).add(new THREE.Vector3(0, 1.2, 0.3));
    this.targetLookAt.copy(kartPosition).add(forwardDirection.multiplyScalar(10));
    
    this.currentPosition.copy(this.targetPosition);
    this.currentLookAt.copy(this.targetLookAt);
  }

  public update(deltaTime: number = 0.016): void {
    const kartState = this.target.getState();
    
    switch (this.config.mode) {
      case CameraMode.CHASE:
        this.updateChaseCamera(kartState, deltaTime);
        break;
      case CameraMode.FOLLOW:
        this.updateFollowCamera(kartState, deltaTime);
        break;
      case CameraMode.OVERHEAD:
        this.updateOverheadCamera(kartState, deltaTime);
        break;
      case CameraMode.COCKPIT:
        this.updateCockpitCamera(kartState, deltaTime);
        break;
    }
    
    // Apply smooth interpolation
    this.currentPosition.lerp(this.targetPosition, this.config.smoothing);
    this.currentLookAt.lerp(this.targetLookAt, this.config.smoothing);
    
    // Apply position and look-at to camera
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
    
    // Debug camera
    if (Math.random() < 0.02) {
      console.log('📹 Camera pos:', this.camera.position.x.toFixed(1), this.camera.position.z.toFixed(1), 
                  'Looking at:', this.currentLookAt.x.toFixed(1), this.currentLookAt.z.toFixed(1));
    }
  }

  private updateChaseCamera(kartState: any, deltaTime: number = 0.016): void {
    // Get kart world position and rotation
    const kartPosition = new THREE.Vector3(
      kartState.position.x,
      kartState.position.y,
      kartState.position.z
    );
    
    const kartRotation = new THREE.Euler(
      kartState.rotation.x,
      kartState.rotation.y,
      kartState.rotation.z
    );
    
    const kartVelocity = new THREE.Vector3(
      kartState.velocity.x,
      kartState.velocity.y,
      kartState.velocity.z
    );
    
    // Calculate camera position behind and above the kart
    const cameraPosition = this.calculateChasePosition(kartPosition, kartRotation, kartVelocity);
    
    // Calculate look-ahead point based on velocity
    const lookAtPoint = this.calculateLookAheadPoint(kartPosition, kartVelocity, kartRotation);
    
    // Apply banking based on turning and speed
    const bankingOffset = this.calculateBanking(kartState, deltaTime);
    cameraPosition.add(bankingOffset);
    
    this.targetPosition.copy(cameraPosition);
    this.targetLookAt.copy(lookAtPoint);
  }

  private calculateChasePosition(kartPosition: THREE.Vector3, kartRotation: THREE.Euler, kartVelocity: THREE.Vector3): THREE.Vector3 {
    // Create backward direction relative to kart's facing direction
    const backwardDirection = new THREE.Vector3(0, 0, 1); // Positive Z is backward in Three.js
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(kartRotation);
    backwardDirection.applyMatrix4(rotationMatrix);
    
    // Base camera position: behind and above the kart
    // (calculated inline below with dynamic distance)
    
    // Adjust distance based on speed for better view at high speeds
    const speed = kartVelocity.length();
    const speedFactor = Math.min(speed / 20, 1.5); // Scale with speed, max 1.5x
    const dynamicDistance = this.config.distance * (1 + speedFactor * 0.3);
    
    // Recalculate with dynamic distance
    const adjustedBackward = new THREE.Vector3(0, 0, 1);
    adjustedBackward.applyMatrix4(rotationMatrix);
    
    return kartPosition.clone()
      .add(adjustedBackward.multiplyScalar(dynamicDistance))
      .add(new THREE.Vector3(0, this.config.height, 0));
  }

  private calculateLookAheadPoint(kartPosition: THREE.Vector3, kartVelocity: THREE.Vector3, kartRotation: THREE.Euler): THREE.Vector3 {
    // Base look-at point slightly above the kart
    const lookAtBase = kartPosition.clone().add(new THREE.Vector3(0, 1, 0));
    
    // Add look-ahead based on velocity
    const lookAheadDistance = Math.min(kartVelocity.length() * this.config.lookAhead, 15); // Max look-ahead
    
    if (lookAheadDistance > 0.1) {
      // Use velocity direction for look-ahead
      const velocityDirection = kartVelocity.clone().normalize();
      lookAtBase.add(velocityDirection.multiplyScalar(lookAheadDistance));
    } else {
      // When stationary, look in kart's facing direction
      const forwardDirection = new THREE.Vector3(0, 0, -1);
      const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(kartRotation);
      forwardDirection.applyMatrix4(rotationMatrix);
      lookAtBase.add(forwardDirection.multiplyScalar(this.config.lookAhead));
    }
    
    return lookAtBase;
  }

  private calculateBanking(kartState: any, _deltaTime: number = 0.016): THREE.Vector3 {
    // Calculate banking offset based on steering input and speed
    const steeringInput = kartState.steering || 0;
    const speed = new THREE.Vector3(kartState.velocity.x, kartState.velocity.y, kartState.velocity.z).length();
    
    // Banking intensity based on speed and steering
    const bankingIntensity = Math.abs(steeringInput) * Math.min(speed / 15, 1) * 0.8;
    
    // Create sideways offset for banking effect
    const kartRotation = new THREE.Euler(kartState.rotation.x, kartState.rotation.y, kartState.rotation.z);
    const rightDirection = new THREE.Vector3(1, 0, 0);
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(kartRotation);
    rightDirection.applyMatrix4(rotationMatrix);
    
    // Apply banking offset (camera slightly moves to outside of turn)
    const bankingOffset = rightDirection.multiplyScalar(steeringInput * bankingIntensity);
    bankingOffset.y += Math.abs(steeringInput) * 0.2; // Slight height variation during turns
    
    return bankingOffset;
  }

  private updateFollowCamera(kartState: any, _deltaTime: number = 0.016): void {
    const kartPosition = new THREE.Vector3(
      kartState.position.x,
      kartState.position.y,
      kartState.position.z
    );
    
    this.targetPosition.copy(kartPosition).add(new THREE.Vector3(-this.config.distance, this.config.height, 0));
    this.targetLookAt.copy(kartPosition);
  }

  private updateOverheadCamera(kartState: any, _deltaTime: number = 0.016): void {
    const kartPosition = new THREE.Vector3(
      kartState.position.x,
      kartState.position.y,
      kartState.position.z
    );
    
    this.targetPosition.copy(kartPosition).add(new THREE.Vector3(0, 20, 0));
    this.targetLookAt.copy(kartPosition);
  }

  private updateCockpitCamera(kartState: any, _deltaTime: number = 0.016): void {
    const kartPosition = new THREE.Vector3(
      kartState.position.x,
      kartState.position.y,
      kartState.position.z
    );
    
    const kartRotation = new THREE.Euler(
      kartState.rotation.x,
      kartState.rotation.y,
      kartState.rotation.z
    );
    
    const forwardDirection = new THREE.Vector3(0, 0, -1);
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(kartRotation);
    forwardDirection.applyMatrix4(rotationMatrix);
    
    this.targetPosition.copy(kartPosition).add(new THREE.Vector3(0, 1.2, 0.3));
    this.targetLookAt.copy(kartPosition).add(forwardDirection.multiplyScalar(10));
  }




  public setCameraMode(mode: CameraMode): void {
    this.config.mode = mode;
    this.initializePosition();
  }

  public setConfig(newConfig: Partial<CameraConfig>): void {
    Object.assign(this.config, newConfig);
    if (newConfig.fov) {
      this.camera.fov = newConfig.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  public getCameraMode(): CameraMode {
    return this.config.mode;
  }

  public getConfig(): CameraConfig {
    return { ...this.config };
  }
}