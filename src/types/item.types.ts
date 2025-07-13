// Item system type definitions for Business Cat Racing power-up system

import type { Vector3D } from './game.types';
import type { Kart } from '@/entities/Kart';

/**
 * Core item types following business/office theme
 */
export enum ItemType {
  // Offensive Items
  BRIEFCASE_MISSILE = 'briefcase_missile',
  STAPLER_SHOT = 'stapler_shot',
  RED_PEN = 'red_pen',
  PAPER_STACK = 'paper_stack',
  OFFICE_PHONE = 'office_phone',
  
  // Defensive Items
  PROMOTION_STAR = 'promotion_star',
  EXPENSE_SHIELD = 'expense_shield',
  FILING_CABINET = 'filing_cabinet',
  
  // Utility Items
  COFFEE_CUP = 'coffee_cup',
  TELECOMMUTE_PORTAL = 'telecommute_portal',
  
  // Environmental Items
  PAPERWORK_STORM = 'paperwork_storm',
  FIRE_DRILL_ALARM = 'fire_drill_alarm',
}

/**
 * Item categories for balanced distribution
 */
export enum ItemCategory {
  OFFENSIVE = 'offensive',
  DEFENSIVE = 'defensive',
  UTILITY = 'utility',
  ENVIRONMENTAL = 'environmental',
}

/**
 * Power level for balancing system
 */
export enum PowerLevel {
  LIGHT = 1,    // Coffee Cup, Paper Stack
  MEDIUM = 2,   // Stapler Shot, Red Pen
  HEAVY = 3,    // Briefcase Missile, Promotion Star
  EXTREME = 4   // Office Phone, Paperwork Storm
}

/**
 * Item rarity affects pickup probability
 */
export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  LEGENDARY = 'legendary'
}

/**
 * Base item configuration
 */
export interface ItemConfig {
  type: ItemType;
  category: ItemCategory;
  powerLevel: PowerLevel;
  rarity: ItemRarity;
  name: string;
  description: string;
  icon: string;
  cooldown: number; // milliseconds
  duration?: number; // milliseconds (for timed effects)
  maxInstances?: number; // max instances that can exist simultaneously
}

/**
 * Item state during gameplay
 */
export interface ItemState {
  id: string;
  type: ItemType;
  owner?: Kart;
  position: Vector3D;
  isActive: boolean;
  timeRemaining?: number;
  target?: Kart;
  effectStrength?: number;
}

/**
 * Item effect configuration
 */
export interface ItemEffect {
  type: 'speed_boost' | 'spin_out' | 'invulnerability' | 'teleport' | 'slow_down' | 'confusion';
  intensity: number;
  duration: number;
  visualEffect?: string;
  audioEffect?: string;
}

/**
 * Item pickup probability weights based on race position
 */
export interface ItemDistributionWeights {
  [key: number]: { // race position (1st, 2nd, etc.)
    offensive: number;
    defensive: number;
    utility: number;
    environmental: number;
  };
}

/**
 * Item box configuration
 */
export interface ItemBoxConfig {
  id: string;
  position: Vector3D;
  rotation: Vector3D;
  type: 'standard' | 'executive' | 'quarterly';
  respawnTime: number; // milliseconds
  isActive: boolean;
  lastPickupTime: number;
}

/**
 * Item inventory for players
 */
export interface ItemInventory {
  currentItem?: ItemType;
  itemCount: number;
  canUseItem: boolean;
  lastUsedTime: number;
  itemCooldown: number;
}

/**
 * Item usage result
 */
export interface ItemUsageResult {
  success: boolean;
  effect?: ItemEffect;
  message?: string;
  targetKarts?: Kart[];
  spawnedItems?: ItemState[];
}

/**
 * Item collision data
 */
export interface ItemCollision {
  item: ItemState;
  target: Kart;
  collisionPoint: Vector3D;
  collisionForce: number;
  timestamp: number;
}

/**
 * Item manager configuration
 */
export interface ItemManagerConfig {
  maxActiveItems: number;
  defaultRespawnTime: number;
  enableRubberBanding: boolean;
  distributionWeights: ItemDistributionWeights;
  globalCooldown: number;
}

/**
 * Item database for all available items
 */
export interface ItemDatabase {
  [ItemType.BRIEFCASE_MISSILE]: ItemConfig;
  [ItemType.STAPLER_SHOT]: ItemConfig;
  [ItemType.RED_PEN]: ItemConfig;
  [ItemType.PAPER_STACK]: ItemConfig;
  [ItemType.OFFICE_PHONE]: ItemConfig;
  [ItemType.PROMOTION_STAR]: ItemConfig;
  [ItemType.EXPENSE_SHIELD]: ItemConfig;
  [ItemType.FILING_CABINET]: ItemConfig;
  [ItemType.COFFEE_CUP]: ItemConfig;
  [ItemType.TELECOMMUTE_PORTAL]: ItemConfig;
  [ItemType.PAPERWORK_STORM]: ItemConfig;
  [ItemType.FIRE_DRILL_ALARM]: ItemConfig;
}

/**
 * Default item distribution weights (rubber-band system)
 */
export const DEFAULT_ITEM_DISTRIBUTION: ItemDistributionWeights = {
  1: { offensive: 0.1, defensive: 0.3, utility: 0.5, environmental: 0.1 }, // Leader gets mostly defensive/utility
  2: { offensive: 0.2, defensive: 0.4, utility: 0.3, environmental: 0.1 },
  3: { offensive: 0.3, defensive: 0.3, utility: 0.3, environmental: 0.1 },
  4: { offensive: 0.4, defensive: 0.2, utility: 0.3, environmental: 0.1 },
  5: { offensive: 0.5, defensive: 0.2, utility: 0.2, environmental: 0.1 },
  6: { offensive: 0.6, defensive: 0.1, utility: 0.2, environmental: 0.1 },
  7: { offensive: 0.7, defensive: 0.1, utility: 0.1, environmental: 0.1 },
  8: { offensive: 0.8, defensive: 0.05, utility: 0.1, environmental: 0.05 }, // Last place gets powerful offensive items
};

/**
 * Item database with all business-themed items
 */
export const ITEM_DATABASE: ItemDatabase = {
  [ItemType.COFFEE_CUP]: {
    type: ItemType.COFFEE_CUP,
    category: ItemCategory.UTILITY,
    powerLevel: PowerLevel.LIGHT,
    rarity: ItemRarity.COMMON,
    name: 'Coffee Cup Boost',
    description: 'Caffeine-powered speed boost with jittery handling',
    icon: '☕',
    cooldown: 1000,
    duration: 8000,
  },
  
  [ItemType.STAPLER_SHOT]: {
    type: ItemType.STAPLER_SHOT,
    category: ItemCategory.OFFENSIVE,
    powerLevel: PowerLevel.MEDIUM,
    rarity: ItemRarity.COMMON,
    name: 'Stapler Shot',
    description: 'Fires staples that cause brief spin-outs',
    icon: '📎',
    cooldown: 1500,
    maxInstances: 3,
  },
  
  [ItemType.RED_PEN]: {
    type: ItemType.RED_PEN,
    category: ItemCategory.OFFENSIVE,
    powerLevel: PowerLevel.MEDIUM,
    rarity: ItemRarity.UNCOMMON,
    name: 'Red Pen Correction',
    description: 'Homing projectile that seeks nearest opponent',
    icon: '🖊️',
    cooldown: 2000,
    maxInstances: 1,
  },
  
  [ItemType.PAPER_STACK]: {
    type: ItemType.PAPER_STACK,
    category: ItemCategory.OFFENSIVE,
    powerLevel: PowerLevel.LIGHT,
    rarity: ItemRarity.COMMON,
    name: 'Paper Stack Hazard',
    description: 'Drops slippery documents behind your kart',
    icon: '📄',
    cooldown: 1000,
    maxInstances: 3,
  },
  
  [ItemType.FILING_CABINET]: {
    type: ItemType.FILING_CABINET,
    category: ItemCategory.DEFENSIVE,
    powerLevel: PowerLevel.MEDIUM,
    rarity: ItemRarity.UNCOMMON,
    name: 'Filing Cabinet Barrier',
    description: 'Creates a protective barrier behind you',
    icon: '🗄️',
    cooldown: 3000,
    duration: 10000,
    maxInstances: 1,
  },
  
  [ItemType.OFFICE_PHONE]: {
    type: ItemType.OFFICE_PHONE,
    category: ItemCategory.ENVIRONMENTAL,
    powerLevel: PowerLevel.EXTREME,
    rarity: ItemRarity.RARE,
    name: 'Conference Call Chaos',
    description: 'Area effect that slows and confuses nearby karts',
    icon: '📞',
    cooldown: 5000,
    duration: 5000,
    maxInstances: 1,
  },
  
  [ItemType.BRIEFCASE_MISSILE]: {
    type: ItemType.BRIEFCASE_MISSILE,
    category: ItemCategory.OFFENSIVE,
    powerLevel: PowerLevel.HEAVY,
    rarity: ItemRarity.RARE,
    name: 'Briefcase Missile',
    description: 'Powerful homing missile that causes major spin-out',
    icon: '💼',
    cooldown: 4000,
    maxInstances: 1,
  },
  
  [ItemType.PROMOTION_STAR]: {
    type: ItemType.PROMOTION_STAR,
    category: ItemCategory.DEFENSIVE,
    powerLevel: PowerLevel.HEAVY,
    rarity: ItemRarity.RARE,
    name: 'Promotion Star',
    description: 'Temporary invincibility with speed boost',
    icon: '⭐',
    cooldown: 6000,
    duration: 6000,
  },
  
  [ItemType.EXPENSE_SHIELD]: {
    type: ItemType.EXPENSE_SHIELD,
    category: ItemCategory.DEFENSIVE,
    powerLevel: PowerLevel.MEDIUM,
    rarity: ItemRarity.UNCOMMON,
    name: 'Expense Account Shield',
    description: 'Absorbs one incoming attack',
    icon: '🛡️',
    cooldown: 2500,
    duration: 15000,
  },
  
  [ItemType.TELECOMMUTE_PORTAL]: {
    type: ItemType.TELECOMMUTE_PORTAL,
    category: ItemCategory.UTILITY,
    powerLevel: PowerLevel.HEAVY,
    rarity: ItemRarity.RARE,
    name: 'Telecommute Portal',
    description: 'Instant teleportation forward on track',
    icon: '🌀',
    cooldown: 8000,
  },
  
  [ItemType.PAPERWORK_STORM]: {
    type: ItemType.PAPERWORK_STORM,
    category: ItemCategory.ENVIRONMENTAL,
    powerLevel: PowerLevel.EXTREME,
    rarity: ItemRarity.LEGENDARY,
    name: 'Paperwork Storm',
    description: 'Reduces visibility for all players in area',
    icon: '📋',
    cooldown: 10000,
    duration: 6000,
    maxInstances: 1,
  },
  
  [ItemType.FIRE_DRILL_ALARM]: {
    type: ItemType.FIRE_DRILL_ALARM,
    category: ItemCategory.ENVIRONMENTAL,
    powerLevel: PowerLevel.EXTREME,
    rarity: ItemRarity.LEGENDARY,
    name: 'Fire Drill Alarm',
    description: 'Forces all karts to move in one direction',
    icon: '🚨',
    cooldown: 12000,
    duration: 5000,
    maxInstances: 1,
  },
};