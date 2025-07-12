// Character and kart type definitions

export enum CharacterType {
  BUSINESS_CAT = 'businessCat',
  EXECUTIVE_DOG = 'executiveDog',
  CFO_RABBIT = 'cfoRabbit',
  MANAGER_MOUSE = 'managerMouse',
  DIRECTOR_BEAR = 'directorBear',
  SECRETARY_BIRD = 'secretaryBird',
  INTERN_HAMSTER = 'internHamster',
  CEO_LION = 'ceoLion',
}

export interface CharacterStats {
  speed: number;        // 1-10
  acceleration: number; // 1-10
  handling: number;     // 1-10
  weight: number;      // 1-10
}

export interface CharacterConfig {
  type: CharacterType;
  name: string;
  species: string;
  corporateRole: string;
  stats: CharacterStats;
  specialAbility: SpecialAbility;
  description: string;
  unlockCondition?: string;
}

export interface SpecialAbility {
  name: string;
  description: string;
  cooldown: number; // milliseconds
  duration: number; // milliseconds
  effect: AbilityEffect;
}

export enum AbilityEffect {
  SPEED_BOOST = 'speedBoost',
  SHIELD = 'shield',
  COIN_MULTIPLIER = 'coinMultiplier',
  ITEM_AMPLIFY = 'itemAmplify',
  IMMUNITY = 'immunity',
  CONFUSION = 'confusion',
  COPY_ABILITY = 'copyAbility',
  TELEPORT = 'teleport',
}

export interface KartCustomization {
  bodyColor: string;
  wheelType: string;
  accessories: string[];
  decals: string[];
}