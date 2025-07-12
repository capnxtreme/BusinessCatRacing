// Unit tests for CameraManager class

import * as THREE from 'three';
import { CameraManager } from '@/engine/CameraManager';
import { 
  CameraMode, 
  CameraFollowType, 
  CameraTarget, 
  CameraShakeConfig
} from '@/types/camera.types';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true,
});

describe('CameraManager', () => {
  let cameraManager: CameraManager;
  let camera: THREE.PerspectiveCamera;
  let scene: THREE.Scene;
  let targetObject: THREE.Object3D;
  let target: CameraTarget;

  beforeEach(() => {
    // Reset performance.now mock
    mockPerformanceNow.mockReturnValue(0);

    // Create Three.js objects
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    scene = new THREE.Scene();
    targetObject = new THREE.Object3D();
    targetObject.position.set(0, 0, 0);
    scene.add(targetObject);

    target = {
      object3D: targetObject,
      velocity: new THREE.Vector3(0, 0, 0),
      priority: 1,
      isActive: true,
    };

    cameraManager = new CameraManager(camera, scene);
  });

  afterEach(() => {
    cameraManager.dispose();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create camera manager with default configuration', () => {
      expect(cameraManager).toBeDefined();
      expect(cameraManager.getCamera()).toBe(camera);
      
      const config = cameraManager.getConfig();
      expect(config.mode).toBe(CameraMode.FOLLOW);
      expect(config.followType).toBe(CameraFollowType.BEHIND);
      expect(config.fov).toBe(75);
    });

    it('should accept custom initial configuration', () => {
      const customConfig = {
        mode: CameraMode.CINEMATIC,
        fov: 90,
        offset: {
          position: { x: 1, y: 2, z: 3 },
          rotation: { x: 0, y: 0, z: 0 },
        },
      };

      const customCameraManager = new CameraManager(camera, scene, customConfig);
      const config = customCameraManager.getConfig();
      
      expect(config.mode).toBe(CameraMode.CINEMATIC);
      expect(config.fov).toBe(90);
      expect(config.offset.position.x).toBe(1);
      expect(config.offset.position.y).toBe(2);
      expect(config.offset.position.z).toBe(3);

      customCameraManager.dispose();
    });

    it('should initialize camera properties correctly', () => {
      expect(camera.fov).toBe(75);
      expect(camera.near).toBe(0.1);
      expect(camera.far).toBe(1000);
    });
  });

  describe('Target Management', () => {
    it('should set and get target correctly', () => {
      cameraManager.setTarget(target);
      
      const state = cameraManager.getState();
      expect(state.currentTarget).toBe(target);
    });

    it('should clear target correctly', () => {
      cameraManager.setTarget(target);
      cameraManager.clearTarget();
      
      const state = cameraManager.getState();
      expect(state.currentTarget).toBeNull();
    });

    it('should emit target change events', () => {
      const targetChangeHandler = jest.fn();
      cameraManager.on('targetChanged', targetChangeHandler);

      cameraManager.setTarget(target);
      expect(targetChangeHandler).toHaveBeenCalledWith({
        from: null,
        to: target,
      });

      cameraManager.clearTarget();
      expect(targetChangeHandler).toHaveBeenCalledWith({
        from: target,
        to: null,
      });
    });
  });

  describe('Camera Modes', () => {
    it('should set camera mode correctly', () => {
      cameraManager.setMode(CameraMode.CINEMATIC, CameraFollowType.ORBIT);
      
      const state = cameraManager.getState();
      const config = cameraManager.getConfig();
      
      expect(state.mode).toBe(CameraMode.CINEMATIC);
      expect(config.mode).toBe(CameraMode.CINEMATIC);
      expect(config.followType).toBe(CameraFollowType.ORBIT);
    });

    it('should emit mode change events', () => {
      const modeChangeHandler = jest.fn();
      cameraManager.on('modeChanged', modeChangeHandler);

      cameraManager.setMode(CameraMode.FREE);
      
      expect(modeChangeHandler).toHaveBeenCalledWith({
        from: CameraMode.FOLLOW,
        to: CameraMode.FREE,
      });
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        fov: 90,
        smoothing: {
          position: 0.2,
          rotation: 0.2,
          lookAt: 0.3,
        },
      };

      cameraManager.setConfig(newConfig);
      
      const config = cameraManager.getConfig();
      expect(config.fov).toBe(90);
      expect(config.smoothing.position).toBe(0.2);
      expect(config.smoothing.rotation).toBe(0.2);
      expect(config.smoothing.lookAt).toBe(0.3);
      
      // Camera should be updated
      expect(camera.fov).toBe(90);
    });
  });

  describe('Camera Shake', () => {
    it('should start camera shake correctly', () => {
      const shakeConfig: CameraShakeConfig = {
        intensity: 1.0,
        duration: 500,
        frequency: 10,
        decay: 0.1,
      };

      const shakeStartHandler = jest.fn();
      cameraManager.on('shakeStarted', shakeStartHandler);

      cameraManager.startShake(shakeConfig);
      
      const state = cameraManager.getState();
      expect(state.shake.isActive).toBe(true);
      expect(state.shake.timeRemaining).toBe(500);
      expect(state.shake.currentIntensity).toBe(1.0);
      
      expect(shakeStartHandler).toHaveBeenCalledWith({ config: shakeConfig });
    });

    it('should stop camera shake correctly', () => {
      const shakeConfig: CameraShakeConfig = {
        intensity: 1.0,
        duration: 500,
        frequency: 10,
        decay: 0.1,
      };

      const shakeEndHandler = jest.fn();
      cameraManager.on('shakeEnded', shakeEndHandler);

      cameraManager.startShake(shakeConfig);
      cameraManager.stopShake();
      
      const state = cameraManager.getState();
      expect(state.shake.isActive).toBe(false);
      expect(state.shake.timeRemaining).toBe(0);
      expect(state.shake.currentIntensity).toBe(0);
      
      expect(shakeEndHandler).toHaveBeenCalled();
    });

    it('should update shake over time', () => {
      const shakeConfig: CameraShakeConfig = {
        intensity: 1.0,
        duration: 500,
        frequency: 10,
        decay: 0.1,
      };

      cameraManager.startShake(shakeConfig);
      
      // Simulate time passing (100ms)
      cameraManager.update(0.1);
      
      const state = cameraManager.getState();
      expect(state.shake.timeRemaining).toBeLessThan(500);
      expect(state.shake.currentIntensity).toBeLessThan(1.0);
    });

    it('should automatically stop shake when duration expires', () => {
      const shakeConfig: CameraShakeConfig = {
        intensity: 1.0,
        duration: 100,
        frequency: 10,
        decay: 0.1,
      };

      const shakeEndHandler = jest.fn();
      cameraManager.on('shakeEnded', shakeEndHandler);

      cameraManager.startShake(shakeConfig);
      
      // Simulate time passing beyond duration (200ms)
      cameraManager.update(0.2);
      
      const state = cameraManager.getState();
      expect(state.shake.isActive).toBe(false);
      expect(shakeEndHandler).toHaveBeenCalled();
    });
  });

  describe('Camera Transitions', () => {
    it('should start transition correctly', () => {
      const targetConfig = {
        fov: 90,
        mode: CameraMode.CINEMATIC,
      };

      const transitionStartHandler = jest.fn();
      cameraManager.on('transitionStarted', transitionStartHandler);

      cameraManager.transitionTo(targetConfig, 1000);
      
      const state = cameraManager.getState();
      expect(state.isTransitioning).toBe(true);
      expect(state.transitionProgress).toBe(0);
      
      expect(transitionStartHandler).toHaveBeenCalled();
    });

    it('should complete transition after duration', () => {
      const targetConfig = {
        fov: 90,
        mode: CameraMode.CINEMATIC,
      };

      const transitionCompleteHandler = jest.fn();
      cameraManager.on('transitionCompleted', transitionCompleteHandler);

      // Start transition
      mockPerformanceNow.mockReturnValue(0);
      cameraManager.transitionTo(targetConfig, 1000);
      
      // Simulate time passing to complete transition
      mockPerformanceNow.mockReturnValue(1000);
      cameraManager.update(0.016); // ~60fps
      
      const state = cameraManager.getState();
      const config = cameraManager.getConfig();
      
      expect(state.isTransitioning).toBe(false);
      expect(state.transitionProgress).toBe(1);
      expect(config.fov).toBe(90);
      expect(config.mode).toBe(CameraMode.CINEMATIC);
      
      expect(transitionCompleteHandler).toHaveBeenCalled();
    });

    it('should interpolate values during transition', () => {
      const targetConfig = {
        fov: 120, // Start: 75, Target: 120
      };

      // Start transition
      mockPerformanceNow.mockReturnValue(0);
      cameraManager.transitionTo(targetConfig, 1000);
      
      // Simulate halfway through transition
      mockPerformanceNow.mockReturnValue(500);
      cameraManager.update(0.016);
      
      const config = cameraManager.getConfig();
      
      // Should be approximately halfway between 75 and 120
      expect(config.fov).toBeGreaterThan(75);
      expect(config.fov).toBeLessThan(120);
    });
  });

  describe('Camera Updates', () => {
    beforeEach(() => {
      cameraManager.setTarget(target);
    });

    it('should update camera position when following target', () => {
      const initialPosition = camera.position.clone();
      
      // Move target
      targetObject.position.set(10, 0, 0);
      
      // Update camera
      cameraManager.update(0.016);
      
      // Camera should have moved (though smoothed, so not exactly to target)
      expect(camera.position.equals(initialPosition)).toBe(false);
    });

    it('should handle different follow types', () => {
      const behindPositions: THREE.Vector3[] = [];
      const overheadPositions: THREE.Vector3[] = [];

      // Test BEHIND mode
      cameraManager.setMode(CameraMode.FOLLOW, CameraFollowType.BEHIND);
      cameraManager.update(0.016);
      behindPositions.push(camera.position.clone());

      // Test OVERHEAD mode
      cameraManager.setMode(CameraMode.FOLLOW, CameraFollowType.OVERHEAD_VIEW);
      cameraManager.update(0.016);
      overheadPositions.push(camera.position.clone());

      // Positions should be different
      expect(behindPositions[0].equals(overheadPositions[0])).toBe(false);
      
      // Overhead should be higher
      expect(overheadPositions[0].y).toBeGreaterThan(behindPositions[0].y);
    });

    it('should handle target with velocity', () => {
      target.velocity = new THREE.Vector3(5, 0, 0);
      cameraManager.setMode(CameraMode.FOLLOW, CameraFollowType.CHASE);
      
      const positionWithoutVelocity = camera.position.clone();
      cameraManager.update(0.016);
      const positionWithVelocity = camera.position.clone();
      
      // With chase mode and velocity, camera behavior should be influenced
      // (exact behavior depends on implementation details)
      expect(positionWithoutVelocity.equals(positionWithVelocity)).toBe(false);
    });
  });

  describe('Bounds Constraints', () => {
    it('should constrain camera to bounds', () => {
      const bounds = {
        min: { x: -10, y: 0, z: -10 },
        max: { x: 10, y: 20, z: 10 },
      };

      cameraManager.setBounds(bounds);
      cameraManager.setTarget(target);
      
      // Move target far outside bounds
      targetObject.position.set(100, 100, 100);
      
      // Force camera to desired position (simulate multiple updates)
      for (let i = 0; i < 100; i++) {
        cameraManager.update(0.016);
      }
      
      // Camera should be constrained within bounds
      expect(camera.position.x).toBeGreaterThanOrEqual(bounds.min.x);
      expect(camera.position.x).toBeLessThanOrEqual(bounds.max.x);
      expect(camera.position.y).toBeGreaterThanOrEqual(bounds.min.y);
      expect(camera.position.y).toBeLessThanOrEqual(bounds.max.y);
      expect(camera.position.z).toBeGreaterThanOrEqual(bounds.min.z);
      expect(camera.position.z).toBeLessThanOrEqual(bounds.max.z);
    });
  });

  describe('Event System', () => {
    it('should register and trigger event listeners', () => {
      const modeChangeHandler = jest.fn();
      const targetChangeHandler = jest.fn();

      cameraManager.on('modeChanged', modeChangeHandler);
      cameraManager.on('targetChanged', targetChangeHandler);

      cameraManager.setMode(CameraMode.FREE);
      cameraManager.setTarget(target);

      expect(modeChangeHandler).toHaveBeenCalled();
      expect(targetChangeHandler).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      const modeChangeHandler = jest.fn();

      cameraManager.on('modeChanged', modeChangeHandler);
      cameraManager.off('modeChanged', modeChangeHandler);
      
      cameraManager.setMode(CameraMode.FREE);

      expect(modeChangeHandler).not.toHaveBeenCalled();
    });
  });

  describe('Preset Configurations', () => {
    it('should provide kart racing presets', () => {
      const presets = CameraManager.createKartRacingPresets();
      
      expect(presets).toHaveProperty('chase');
      expect(presets).toHaveProperty('cockpit');
      expect(presets).toHaveProperty('overhead');
      expect(presets).toHaveProperty('cinematic');
      
      // Test chase preset
      expect(presets.chase.mode).toBe(CameraMode.FOLLOW);
      expect(presets.chase.followType).toBe(CameraFollowType.CHASE);
      expect(typeof presets.chase.fov).toBe('number');
      
      // Test cockpit preset
      expect(presets.cockpit.followType).toBe(CameraFollowType.BEHIND);
      expect(presets.cockpit.offset.position.z).toBeLessThan(presets.chase.offset.position.z);
      
      // Test overhead preset
      expect(presets.overhead.followType).toBe(CameraFollowType.OVERHEAD_VIEW);
      expect(presets.overhead.offset.position.y).toBeGreaterThan(0);
    });

    it('should apply preset configurations correctly', () => {
      const presets = CameraManager.createKartRacingPresets();
      
      cameraManager.setConfig(presets.chase);
      
      const config = cameraManager.getConfig();
      expect(config.mode).toBe(presets.chase.mode);
      expect(config.followType).toBe(presets.chase.followType);
      expect(config.fov).toBe(presets.chase.fov);
    });
  });

  describe('Disposal', () => {
    it('should clean up resources on disposal', () => {
      const modeChangeHandler = jest.fn();
      cameraManager.on('modeChanged', modeChangeHandler);
      
      cameraManager.startShake({
        intensity: 1.0,
        duration: 1000,
        frequency: 10,
        decay: 0.1,
      });

      cameraManager.transitionTo({ fov: 90 }, 1000);
      
      cameraManager.dispose();
      
      const state = cameraManager.getState();
      expect(state.shake.isActive).toBe(false);
      expect(state.isTransitioning).toBe(false);
      
      // Events should not fire after disposal
      cameraManager.setMode(CameraMode.FREE);
      expect(modeChangeHandler).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle update without target gracefully', () => {
      // No target set
      expect(() => cameraManager.update(0.016)).not.toThrow();
    });

    it('should handle zero delta time', () => {
      cameraManager.setTarget(target);
      expect(() => cameraManager.update(0)).not.toThrow();
    });

    it('should handle negative delta time', () => {
      cameraManager.setTarget(target);
      expect(() => cameraManager.update(-0.016)).not.toThrow();
    });

    it('should handle very large delta time', () => {
      cameraManager.setTarget(target);
      expect(() => cameraManager.update(1.0)).not.toThrow();
    });

    it('should handle multiple rapid mode changes', () => {
      cameraManager.setMode(CameraMode.FOLLOW);
      cameraManager.setMode(CameraMode.FREE);
      cameraManager.setMode(CameraMode.CINEMATIC);
      cameraManager.setMode(CameraMode.FOLLOW);
      
      expect(cameraManager.getState().mode).toBe(CameraMode.FOLLOW);
    });

    it('should handle overlapping transitions', () => {
      cameraManager.transitionTo({ fov: 90 }, 1000);
      cameraManager.transitionTo({ fov: 60 }, 500);
      
      // Should handle the second transition
      const state = cameraManager.getState();
      expect(state.isTransitioning).toBe(true);
    });
  });
});