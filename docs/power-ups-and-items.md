# Power-Ups and Items System Design

## Overview

The Business Cat Racing power-up system features corporate-themed items that provide strategic advantages while maintaining the fun and balance of classic kart racing gameplay. Each item reflects common office experiences and business culture while offering distinct gameplay mechanics.

## Item Categories

### 1. Offensive Items
Items designed to hinder opponents or create obstacles.

### 2. Defensive Items
Items that protect the user or provide escape mechanisms.

### 3. Utility Items
Items that provide strategic advantages or alter race conditions.

### 4. Environmental Items
Items that affect the track or multiple players simultaneously.

## Complete Item Roster

### Offensive Items

#### 1. Briefcase Missile
**Theme:** Corporate projectile weapon  
**Behavior:** Homing missile that seeks nearest opponent ahead  
**Visual:** Brown leather briefcase with small rocket boosters  
**Effect:** Spins out target kart for 2 seconds  
**Range:** 30 meters homing range  
**Damage:** Medium impact, causes spin-out  

**Implementation:**
```typescript
class BriefcaseMissile extends ProjectileItem {
  private target: Kart | null = null;
  private readonly homingStrength = 0.8;
  private readonly maxSpeed = 25; // m/s
  
  launch(launcher: Kart): void {
    this.target = this.findNearestOpponent(launcher);
    const launchVelocity = this.calculateLaunchVector(launcher);
    this.createPhysicsBody(launcher.position, launchVelocity);
    this.startHomingBehavior();
  }
  
  update(deltaTime: number): void {
    if (this.target && this.isValidTarget(this.target)) {
      this.adjustTrajectory(deltaTime);
    }
    this.updateTrailEffect();
  }
}
```

#### 2. Red Tape Barrier
**Theme:** Bureaucratic obstacle  
**Behavior:** Creates temporary wall across track  
**Visual:** Red "CAUTION" tape stretched between poles  
**Effect:** Blocks passage, breaks after 3 hits or 8 seconds  
**Placement:** Dropped behind user, materializes instantly  
**Strategic Use:** Block narrow passages or shortcuts  

```typescript
class RedTapeBarrier extends EnvironmentalItem {
  private readonly maxHits = 3;
  private readonly duration = 8000; // 8 seconds
  private hitCount = 0;
  
  place(position: Vector3, direction: Vector3): void {
    this.createBarrierMesh(position, direction);
    this.createCollisionBody();
    this.startDurationTimer();
  }
  
  onCollision(collider: Kart): void {
    this.hitCount++;
    this.triggerHitEffect(collider);
    
    if (this.hitCount >= this.maxHits) {
      this.destroy();
    }
  }
}
```

#### 3. Banana Peel Reports
**Theme:** Slippery paperwork scattered on track  
**Behavior:** Classic slip hazard mechanics  
**Visual:** Yellow manila folders with papers spilling out  
**Effect:** Causes kart to spin out briefly  
**Quantity:** Drops 3 reports in trailing formation  
**Duration:** Remains until hit or 30 seconds  

```typescript
class BananaPeelReports extends HazardItem {
  private readonly quantity = 3;
  private readonly spacing = 2; // meters between reports
  
  deploy(launcher: Kart): void {
    const dropPosition = launcher.position.clone();
    
    for (let i = 0; i < this.quantity; i++) {
      const offset = launcher.forward.clone().scale(-(i + 1) * this.spacing);
      const position = dropPosition.clone().add(offset);
      this.createHazard(position);
    }
  }
  
  onContact(victim: Kart): void {
    victim.triggerSpinOut(1.5); // 1.5 second spin
    this.playSlipSound();
    this.createPaperScatterEffect();
    this.remove();
  }
}
```

#### 4. Conference Call Bomb
**Theme:** Disruptive meeting invitation  
**Behavior:** Area-of-effect slowdown and confusion  
**Visual:** Ringing conference phone with expanding sound waves  
**Effect:** Slows all karts in 15m radius for 5 seconds  
**Special:** Reverses controls briefly for affected karts  
**Deployment:** Throws forward, explodes on contact or timer  

```typescript
class ConferenceCallBomb extends AreaEffectItem {
  private readonly radius = 15;
  private readonly slowAmount = 0.6; // 40% speed reduction
  private readonly confusionDuration = 2; // seconds
  
  explode(position: Vector3): void {
    const affectedKarts = this.getKartsInRadius(position, this.radius);
    
    affectedKarts.forEach(kart => {
      kart.applySpeedMultiplier(this.slowAmount, 5000);
      kart.applyControlReversal(this.confusionDuration);
    });
    
    this.createSoundWaveEffect(position);
    this.playConferenceCallSound();
  }
}
```

### Defensive Items

#### 5. Promotion Star
**Theme:** Career advancement protection  
**Behavior:** Temporary invincibility with speed boost  
**Visual:** Golden star with corporate insignia, rotating aura  
**Effect:** Immunity to all items and slight speed increase  
**Duration:** 6 seconds of protection  
**Visual Feedback:** Golden sparkle trail, immune to collisions  

```typescript
class PromotionStar extends DefensiveItem {
  private readonly duration = 6000; // 6 seconds
  private readonly speedBoost = 1.1; // 10% speed increase
  
  activate(user: Kart): void {
    user.setInvulnerable(true);
    user.applySpeedMultiplier(this.speedBoost, this.duration);
    user.setTrailEffect('golden_sparkles');
    
    this.scheduleDeactivation(this.duration);
  }
  
  deactivate(user: Kart): void {
    user.setInvulnerable(false);
    user.removeTrailEffect();
    this.playPromotionFanfare();
  }
}
```

#### 6. Expense Account Shield
**Theme:** Financial protection bubble  
**Behavior:** Absorbs one incoming item attack  
**Visual:** Transparent green dome with dollar sign patterns  
**Effect:** Blocks next offensive item, then disappears  
**Duration:** Active until used or 15 seconds expire  
**Interaction:** Can be proactively activated or automatic  

```typescript
class ExpenseAccountShield extends DefensiveItem {
  private readonly maxDuration = 15000; // 15 seconds
  private isActive = false;
  
  activate(user: Kart): void {
    this.isActive = true;
    user.attachShield(this);
    this.createShieldVisual(user);
    this.scheduleExpiration();
  }
  
  onItemCollision(incomingItem: Item): boolean {
    if (this.isActive && incomingItem.isOffensive()) {
      this.blockItem(incomingItem);
      this.deactivate();
      return true; // Item was blocked
    }
    return false; // Item not blocked
  }
}
```

### Utility Items

#### 7. Coffee Cup Boost
**Theme:** Caffeine-powered acceleration  
**Behavior:** Extended speed boost with jittery handling  
**Visual:** Steaming coffee cup with brown liquid trail  
**Effect:** 25% speed increase for 8 seconds  
**Side Effect:** Slightly twitchy steering (adds challenge)  
**Visual Feedback:** Steam trail, subtle screen shake  

```typescript
class CoffeeCupBoost extends UtilityItem {
  private readonly speedMultiplier = 1.25;
  private readonly duration = 8000;
  private readonly jitterIntensity = 0.1;
  
  consume(user: Kart): void {
    user.applySpeedMultiplier(this.speedMultiplier, this.duration);
    user.addSteeringJitter(this.jitterIntensity, this.duration);
    user.setTrailEffect('coffee_steam');
    
    this.playCoffeeSipSound();
    this.createCaffeineEffect(user);
  }
}
```

#### 8. Telecommute Portal
**Theme:** Work-from-home shortcut  
**Behavior:** Instant teleportation forward on track  
**Visual:** Blue swirling portal with laptop icons  
**Effect:** Advances user to next checkpoint or significant distance  
**Limitation:** Cannot be used on final lap  
**Range:** 20-30 meters forward depending on track layout  

```typescript
class TelecommutePortal extends UtilityItem {
  private readonly teleportDistance = 25; // meters
  
  activate(user: Kart): void {
    if (this.isValidTeleportPosition(user)) {
      const targetPosition = this.calculateTeleportTarget(user);
      
      this.createPortalEffect(user.position);
      user.teleportTo(targetPosition);
      this.createArrivalEffect(targetPosition);
      
      this.playTeleportSound();
    } else {
      this.refundItem(user); // Give item back if invalid
    }
  }
  
  private isValidTeleportPosition(user: Kart): boolean {
    return !user.isOnFinalLap() && this.hasValidTargetPosition(user);
  }
}
```

### Environmental Items

#### 9. Paperwork Storm
**Theme:** Document chaos affecting visibility  
**Behavior:** Area effect that obscures vision  
**Visual:** Swirling papers and documents  
**Effect:** Reduces visibility for all players in area  
**Duration:** 6 seconds of reduced vision  
**Area:** 20-meter radius around deployment point  

```typescript
class PaperworkStorm extends EnvironmentalItem {
  private readonly radius = 20;
  private readonly duration = 6000;
  private readonly visibilityReduction = 0.4;
  
  deploy(position: Vector3): void {
    this.createStormEffect(position, this.radius);
    this.affectNearbyPlayers(position);
    
    this.scheduleCleanup(this.duration);
  }
  
  private affectNearbyPlayers(center: Vector3): void {
    const nearbyKarts = this.getKartsInRadius(center, this.radius);
    
    nearbyKarts.forEach(kart => {
      kart.reduceVisibility(this.visibilityReduction, this.duration);
    });
  }
}
```

#### 10. Fire Drill Alarm
**Theme:** Emergency evacuation disruption  
**Behavior:** Forces all players to move in specific direction  
**Visual:** Flashing red lights and arrow indicators  
**Effect:** Adds constant lateral force to all karts  
**Duration:** 5 seconds of forced movement  
**Direction:** Randomly left or right when activated  

```typescript
class FireDrillAlarm extends GlobalEffectItem {
  private readonly force = 800; // Newtons
  private readonly duration = 5000;
  private direction: 'left' | 'right';
  
  activate(): void {
    this.direction = Math.random() < 0.5 ? 'left' : 'right';
    const allKarts = this.getAllKarts();
    
    allKarts.forEach(kart => {
      this.applyLateralForce(kart, this.direction);
    });
    
    this.createGlobalAlarmEffect();
    this.playFireDrillSound();
    this.scheduleDeactivation(this.duration);
  }
  
  private applyLateralForce(kart: Kart, direction: 'left' | 'right'): void {
    const forceMagnitude = direction === 'left' ? -this.force : this.force;
    const lateralForce = new Vector3(forceMagnitude, 0, 0);
    kart.addContinuousForce(lateralForce, this.duration);
  }
}
```

## Item Box System

### Item Box Types

#### Standard Item Box
**Appearance:** Floating briefcase with corporate logo  
**Contents:** Random selection from all available items  
**Weighting:** Balanced distribution based on race position  
**Respawn:** 8 seconds after collection  

#### Executive Item Box
**Appearance:** Golden briefcase with premium materials  
**Contents:** Rare items only (defensive and utility focus)  
**Frequency:** 1 per track, strategic placement  
**Respawn:** 15 seconds after collection  

#### Quarterly Item Box
**Appearance:** Safety-themed box with defensive symbols  
**Contents:** Defensive items only  
**Purpose:** Provides protection for struggling players  
**Placement:** After difficult track sections  

### Dynamic Item Distribution

```typescript
class ItemDistributionSystem {
  private readonly positionWeights = {
    1: { offensive: 0.1, defensive: 0.3, utility: 0.6 }, // Leader gets mostly utility
    2: { offensive: 0.3, defensive: 0.4, utility: 0.3 }, // Balanced
    3: { offensive: 0.4, defensive: 0.3, utility: 0.3 }, // Slightly aggressive
    4: { offensive: 0.6, defensive: 0.2, utility: 0.2 }, // More aggressive
    // Last place gets powerful offensive items
    8: { offensive: 0.7, defensive: 0.2, utility: 0.1 }
  };
  
  selectItem(player: Player): Item {
    const position = player.racePosition;
    const weights = this.positionWeights[position] || this.positionWeights[4];
    
    const itemCategory = this.weightedRandom(weights);
    return this.selectFromCategory(itemCategory, position);
  }
  
  private selectFromCategory(category: string, position: number): Item {
    const availableItems = this.getItemsByCategory(category);
    
    // Additional position-based filtering
    if (position === 1) {
      // Leaders can't get the most powerful offensive items
      availableItems = availableItems.filter(item => 
        item.powerLevel < PowerLevel.EXTREME
      );
    }
    
    return this.randomFromArray(availableItems);
  }
}
```

## Item Balance and Tuning

### Power Level Classification
```typescript
enum PowerLevel {
  LIGHT = 1,    // Coffee Cup, Banana Peels
  MEDIUM = 2,   // Briefcase Missile, Red Tape
  HEAVY = 3,    // Conference Call Bomb, Promotion Star
  EXTREME = 4   // Fire Drill Alarm, Paperwork Storm
}
```

### Balance Considerations

#### Position-Based Balancing
- **1st Place:** Limited access to powerful offensive items
- **2nd-3rd Place:** Balanced item selection
- **4th-6th Place:** Increased offensive item frequency
- **7th-8th Place:** Access to most powerful comeback items

#### Race Situation Balancing
```typescript
class ContextualBalancing {
  adjustItemProbability(player: Player): ItemWeights {
    let weights = this.baseWeights[player.position];
    
    // Adjust based on gap to leader
    const gapToLeader = this.calculateGapToLeader(player);
    if (gapToLeader > 10) { // 10+ seconds behind
      weights.offensive *= 1.5; // Increase comeback potential
    }
    
    // Adjust based on lap number
    if (player.currentLap === player.totalLaps) {
      weights.utility *= 0.5; // Reduce utility items on final lap
      weights.offensive *= 1.3; // Increase attack items
    }
    
    // Adjust based on recent item usage
    if (player.recentlyUsedDefensive()) {
      weights.defensive *= 0.3; // Reduce defensive spam
    }
    
    return weights;
  }
}
```

### Anti-Griefing Measures

#### Item Immunity Periods
```typescript
class ItemImmunitySystem {
  private readonly immunityPeriods = {
    spinOut: 2000,      // 2 seconds after spin-out
    collision: 1000,    // 1 second after collision
    teleport: 1500,     // 1.5 seconds after teleport
    respawn: 3000       // 3 seconds after respawn
  };
  
  isPlayerImmune(player: Player, itemType: ItemType): boolean {
    const lastImpact = player.getLastImpactTime(itemType.category);
    const immunityDuration = this.immunityPeriods[itemType.category];
    
    return (Date.now() - lastImpact) < immunityDuration;
  }
}
```

#### Stacking Prevention
```typescript
class EffectStackingManager {
  private activeEffects: Map<Player, ActiveEffect[]> = new Map();
  
  applyEffect(player: Player, effect: ItemEffect): boolean {
    const existing = this.getActiveEffects(player, effect.type);
    
    // Prevent stacking of similar effects
    if (existing.length > 0) {
      switch (effect.stackingBehavior) {
        case StackingBehavior.REPLACE:
          this.removeExistingEffects(player, effect.type);
          break;
        case StackingBehavior.EXTEND:
          this.extendExistingEffect(existing[0], effect.duration);
          return false;
        case StackingBehavior.BLOCK:
          return false; // Don't apply the new effect
      }
    }
    
    this.addActiveEffect(player, effect);
    return true;
  }
}
```

## Visual and Audio Design

### Item Visual Effects

#### Pickup Effects
```typescript
class ItemPickupEffects {
  triggerPickupEffect(item: Item, player: Player): void {
    // Visual feedback
    this.createSparkleEffect(player.position);
    this.showItemUI(item, player);
    
    // Audio feedback
    this.playPickupSound(item.rarity);
    
    // Haptic feedback (if supported)
    this.triggerHapticFeedback(item.type);
  }
}
```

#### Usage Effects
- **Briefcase Missile:** Smoke trail with homing sparkles
- **Red Tape:** Caution tape animation with warning signs
- **Coffee Cup:** Steam particles and caffeinated screen effects
- **Promotion Star:** Golden aura with upward-floating dollar signs

### Audio Design
- **Item Pickup:** Corporate "ding" sound (elevator bell style)
- **Offensive Items:** Business-appropriate impact sounds
- **Defensive Items:** Professional "shield up" sounds
- **Environmental Items:** Office ambient sounds amplified

## Testing and Iteration

### Balance Testing Framework
```typescript
class ItemBalanceTestSuite {
  testItemEffectiveness(): TestResults {
    const scenarios = [
      'leader_with_offensive_item',
      'last_place_comeback_attempt',
      'tight_pack_racing',
      'final_lap_drama'
    ];
    
    return scenarios.map(scenario => {
      const result = this.simulateScenario(scenario, 1000); // 1000 iterations
      return {
        scenario,
        winRateDistribution: result.winRates,
        avgTimeGaps: result.timeGaps,
        itemUsageStats: result.itemStats
      };
    });
  }
  
  validateItemBalance(results: TestResults): BalanceReport {
    // Ensure no single item dominates
    // Verify position-based comeback mechanics
    // Check for overpowered combinations
    return this.generateBalanceReport(results);
  }
}
```

### Player Feedback Integration
- **Item Satisfaction Surveys:** Post-race feedback on item balance
- **Usage Analytics:** Track which items are used most effectively
- **Win Rate Analysis:** Monitor how items affect race outcomes
- **Player Retention:** Correlate item balance with player engagement

## Future Expansion Ideas

### Seasonal Items
- **Holiday Themes:** Christmas bonus packages, Halloween scares
- **Corporate Events:** Annual meeting chaos, fiscal year-end rush
- **Special Occasions:** Office party items, team building exercises

### Character-Specific Items
- **Business Cat:** "Catnip Boost" - exclusive speed enhancement
- **Executive Dog:** "Loyalty Program" - teammate assistance
- **CFO Rabbit:** "Budget Cut" - resource manipulation

### Advanced Mechanics
- **Item Combinations:** Merge compatible items for enhanced effects
- **Charged Items:** Hold button longer for increased power
- **Contextual Items:** Different effects based on track section