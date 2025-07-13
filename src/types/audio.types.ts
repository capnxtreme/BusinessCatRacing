// Audio system types for Business Cat Racing

export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  engineVolume: number;
  enabled: boolean;
  spatialAudio: boolean;
  audioQuality: 'low' | 'medium' | 'high';
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  engineVolume: number;
  muted: boolean;
  spatialAudioEnabled: boolean;
}

export interface EngineAudioParams {
  rpm: number;
  throttle: number;
  speed: number;
  isAccelerating: boolean;
  isIdle: boolean;
  turboBoost: boolean;
}

export interface SpatialAudioParams {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  listenerPosition: { x: number; y: number; z: number };
  listenerOrientation: {
    forward: { x: number; y: number; z: number };
    up: { x: number; y: number; z: number };
  };
}

export interface AudioBuffer {
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  pannerNode: PannerNode | null;
  isLoaded: boolean;
  isPlaying: boolean;
  loop: boolean;
  volume: number;
}

export interface SoundEffect {
  name: string;
  category: AudioCategory;
  volume: number;
  pitch?: number;
  loop?: boolean;
  spatial?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

export enum AudioCategory {
  ENGINE = 'engine',
  SFX = 'sfx',
  MUSIC = 'music',
  UI = 'ui',
  ENVIRONMENT = 'environment'
}

export enum EngineSound {
  IDLE = 'engine_idle',
  REV = 'engine_rev',
  ACCELERATION = 'engine_acceleration',
  DECELERATION = 'engine_deceleration',
  TURBO = 'engine_turbo',
  BACKFIRE = 'engine_backfire'
}

export enum RacingSFX {
  TIRE_SCREECH = 'tire_screech',
  BRAKE = 'brake',
  COLLISION = 'collision',
  LAP_COMPLETE = 'lap_complete',
  RACE_START = 'race_start',
  COUNTDOWN_BEEP = 'countdown_beep',
  VICTORY_FANFARE = 'victory_fanfare',
  DRIFT = 'drift',
  ITEM_PICKUP = 'item_pickup',
  ITEM_USE = 'item_use'
}

export enum UISound {
  MENU_HOVER = 'menu_hover',
  MENU_CLICK = 'menu_click',
  MENU_SELECT = 'menu_select',
  MENU_BACK = 'menu_back',
  BUTTON_PRESS = 'button_press',
  ERROR = 'error',
  NOTIFICATION = 'notification',
  PAUSE = 'pause',
  UNPAUSE = 'unpause'
}

export enum MusicTrack {
  MENU_THEME = 'menu_theme',
  RACE_TRACK_1 = 'race_track_1',
  RACE_TRACK_2 = 'race_track_2',
  VICTORY_THEME = 'victory_theme',
  RESULTS_THEME = 'results_theme'
}

export enum EnvironmentalSound {
  WIND = 'wind',
  CROWD_CHEER = 'crowd_cheer',
  CROWD_BOOS = 'crowd_boos',
  AMBIENT_TRACK = 'ambient_track',
  GRASS_DRIVING = 'grass_driving',
  GRAVEL_DRIVING = 'gravel_driving',
  ASPHALT_DRIVING = 'asphalt_driving'
}

export interface AudioAssetManifest {
  [key: string]: {
    url: string;
    category: AudioCategory;
    preload: boolean;
    volume: number;
    loop?: boolean;
  };
}

export interface AudioPool {
  name: string;
  maxInstances: number;
  currentInstances: number;
  availableNodes: AudioBufferSourceNode[];
  activeNodes: Set<AudioBufferSourceNode>;
}

export interface AudioFadeConfig {
  duration: number;
  startVolume: number;
  endVolume: number;
  curve?: 'linear' | 'exponential';
}

export interface AudioEvent {
  type: 'play' | 'stop' | 'pause' | 'volumeChange' | 'fadeComplete';
  soundName: string;
  timestamp: number;
  data?: any;
}

export type AudioEventCallback = (event: AudioEvent) => void;