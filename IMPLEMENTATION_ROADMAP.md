# Business Cat Racing - Implementation Roadmap

## Overview
This roadmap provides a phased approach to implementing the missing systems identified in PROJECT_GAPS.md. Each phase builds upon the previous one, ensuring a playable game at each milestone.

**Last Updated**: 2025-07-13 (Post-External Audit)

## Development Principles
- **Incremental Delivery**: Each phase produces a playable improvement
- **Test-Driven Development**: Write tests before implementation
- **Minimal Viable Features**: Implement core functionality first, polish later
- **Regular Integration**: Merge features frequently to avoid conflicts
- **Architecture First**: Address architectural concerns early to avoid costly refactoring
- **Event-Driven Design**: Decouple systems through events for better maintainability

---

## Phase 1: Minimum Viable Racing Game (MVP) - REVISED
**Goal**: Transform the tech demo into a playable single-player racing experience  
**Duration**: 2-3 weeks  
**Outcome**: Can complete a full race with lap times and position

### NEW: 1.0 Architecture Foundation (Week 1, Days 1-2)
```typescript
// Priority tasks:
- [ ] Refactor Game class into system-based architecture
- [ ] Implement basic event bus for decoupling
- [ ] Add error handling framework
- [ ] Create performance monitoring system
- [ ] Set up comprehensive test structure
```

**Implementation Details**:
1. Create `src/core/EventBus.ts` for event-driven communication
2. Split Game class into GameSystems manager
3. Add try-catch blocks to all async operations
4. Implement FPS and memory monitoring

### 1.1 Race Management System (Week 1, Days 2-5)
```typescript
// Priority tasks:
- [ ] Create RaceManager class
- [ ] Implement checkpoint system
- [ ] Add lap counting logic
- [ ] Create start/finish line detection
- [ ] Build race state machine
- [ ] Add wrong-way detection
```

**Implementation Details**:
1. Create `src/game/RaceManager.ts`
2. Define checkpoint zones on track
3. Track kart progress through checkpoints
4. Validate lap completion
5. Calculate race positions
6. Handle race start/finish states

### 1.2 Basic HUD System (Week 1)
```typescript
// Priority tasks:
- [ ] Create HUD class with Three.js sprites
- [ ] Implement speedometer
- [ ] Add lap counter display
- [ ] Show current position
- [ ] Add race timer
- [ ] Create countdown display
```

**Implementation Details**:
1. Create `src/ui/HUD.ts`
2. Use Three.js OrthographicCamera for UI layer
3. Create sprite-based UI elements
4. Update HUD from RaceManager events

### NEW: 1.2.5 Basic AI Opponents (Week 1-2, Parallel Development)
```typescript
// Priority tasks:
- [ ] Create simple AIController class
- [ ] Implement basic waypoint following
- [ ] Add 1-2 AI opponents for testing
- [ ] Basic collision avoidance
```

**Implementation Details**:
1. Create `src/ai/AIController.ts`
2. Simple path following for testing race systems
3. Will be enhanced in Phase 2

### 1.3 Core Audio System (Week 2, Parallel with UI)
```typescript
// Priority tasks:
- [ ] Create AudioManager singleton
- [ ] Implement basic engine sounds
- [ ] Add UI sound effects
- [ ] Create music playback system
- [ ] Implement volume controls
- [ ] Add countdown beeps
```

**Implementation Details**:
1. Create `src/audio/AudioManager.ts`
2. Use Web Audio API for 3D sound
3. Implement sound pooling
4. Connect to game events via EventBus

### 1.4 Minimal Menu System (Week 2, Parallel with Audio)
```typescript
// Priority tasks:
- [ ] Create main menu screen
- [ ] Add race start button
- [ ] Implement pause menu
- [ ] Create results screen
- [ ] Add basic navigation
```

**Implementation Details**:
1. Create `src/ui/MenuSystem.ts`
2. Use HTML/CSS overlay for menus
3. Implement state transitions
4. Connect to game state machine

### NEW: 1.5 Error Handling & Performance Monitoring (Week 2)
```typescript
// Priority tasks:
- [ ] Add error boundaries to all systems
- [ ] Implement asset loading error recovery
- [ ] Create performance monitoring overlay
- [ ] Add debug console commands
```

### Testing Checklist for Phase 1:
- [ ] Event bus properly decouples systems
- [ ] Can start a race from menu
- [ ] Lap counting works correctly with AI opponents
- [ ] Timer displays accurate times
- [ ] Audio plays appropriately
- [ ] Can pause and resume
- [ ] Race completes properly
- [ ] Error handling prevents crashes
- [ ] Performance stays above 60 FPS

---

## Phase 2: Complete Single-Player Experience - REVISED
**Goal**: Add full AI, items, progression, and network foundation  
**Duration**: 2-3 weeks  
**Outcome**: Full single-player racing game with competition

### NEW: 2.0 Network Architecture Design (Week 3, Days 1-2)
```typescript
// Priority tasks:
- [ ] Design client-server architecture
- [ ] Plan state synchronization strategy
- [ ] Define network message protocol
- [ ] Create network interfaces (not implementation)
- [ ] Document multiplayer architecture
```

**Implementation Details**:
1. Create `docs/NETWORK_ARCHITECTURE.md`
2. Design but don't implement - avoid later refactoring
3. Plan for WebSocket/WebRTC approach

### 2.1 Enhanced AI Opponent System (Week 3)
```typescript
// Priority tasks:
- [ ] Enhance basic AI from Phase 1
- [ ] Implement full waypoint navigation
- [ ] Add advanced racing logic
- [ ] Create difficulty levels
- [ ] Implement overtaking behavior
- [ ] Add rubber-band AI
```

**Implementation Details**:
1. Create `src/ai/AIController.ts`
2. Generate racing line waypoints
3. Implement steering and throttle control
4. Add collision avoidance
5. Create 3 difficulty presets

### 2.2 Item System Implementation (Week 3-4)
```typescript
// Priority tasks:
- [ ] Create ItemManager class
- [ ] Implement item box spawning
- [ ] Add pickup detection
- [ ] Create item effects (per type)
- [ ] Add item UI slot
- [ ] Implement item usage
```

**Implementation Details**:
1. Create `src/game/ItemManager.ts`
2. Place item boxes on track
3. Implement each item type:
   - Speed Boost
   - Coffee Splash
   - Banana Peel
   - Shield
   - etc.

### 2.3 Character Integration (Week 4)
```typescript
// Priority tasks:
- [ ] Load character models
- [ ] Integrate with kart visual
- [ ] Apply character stats
- [ ] Create selection screen
- [ ] Add character animations
```

**Implementation Details**:
1. Create `src/entities/Character.ts`
2. Load GLTF character models
3. Attach to kart mesh
4. Apply stat modifiers

### 2.4 Save/Progress System (Week 4)
```typescript
// Priority tasks:
- [ ] Create SaveManager class
- [ ] Implement LocalStorage wrapper
- [ ] Save best times
- [ ] Track unlocks
- [ ] Persist settings
```

**Implementation Details**:
1. Create `src/services/SaveManager.ts`
2. Define save data schema
3. Implement auto-save
4. Add profile support

### NEW: 2.5 Analytics Foundation (Week 4)
```typescript
// Priority tasks:
- [ ] Create AnalyticsManager class
- [ ] Define event tracking schema
- [ ] Implement privacy-compliant tracking
- [ ] Add performance metrics collection
- [ ] Create debug analytics view
```

### NEW: 2.6 Basic Accessibility (Week 4)
```typescript
// Priority tasks:
- [ ] Add colorblind mode toggle
- [ ] Implement basic subtitle system
- [ ] Create control remapping
- [ ] Add difficulty assists option
```

### Testing Checklist for Phase 2:
- [ ] AI opponents race competitively
- [ ] Items work as designed
- [ ] Characters have unique stats
- [ ] Progress saves correctly
- [ ] Difficulty affects AI behavior
- [ ] Network architecture documented
- [ ] Analytics tracking key events
- [ ] Basic accessibility features work

---

## Phase 3: Polish & Optimization - REVISED
**Goal**: Improve performance, architecture, and user experience  
**Duration**: 1-2 weeks  
**Outcome**: Smooth, polished racing experience

### NEW: 3.0 Architecture Refactoring (Week 5, Days 1-2)
```typescript
// Priority tasks:
- [ ] Complete ECS migration if needed
- [ ] Ensure all systems use EventBus
- [ ] Refactor any remaining monolithic classes
- [ ] Add comprehensive error boundaries
```

### 3.1 Performance Optimization (Week 5)
```typescript
// Priority tasks:
- [ ] Implement object pooling
- [ ] Add LOD system
- [ ] Optimize particle effects
- [ ] Add frustum culling
- [ ] Reduce draw calls
- [ ] Integrate Web Workers for physics
- [ ] Implement spatial partitioning
```

### 3.2 Enhanced UI/UX (Week 5)
```typescript
// Priority tasks:
- [ ] Improve menu design
- [ ] Add transitions
- [ ] Create settings menu
- [ ] Implement control hints
- [ ] Add loading screens
```

### 3.3 Error Handling (Week 6)
```typescript
// Priority tasks:
- [ ] Add error boundaries
- [ ] Implement retry logic
- [ ] Create fallback assets
- [ ] Add crash recovery
```

### 3.4 Additional Content (Week 6)
```typescript
// Priority tasks:
- [ ] Create 2-3 new tracks
- [ ] Add championship mode
- [ ] Implement time trials
- [ ] Create tutorial
```

### NEW: 3.5 Comprehensive Testing (Week 6)
```typescript
// Priority tasks:
- [ ] Achieve 80% test coverage
- [ ] Add integration tests for all systems
- [ ] Create performance benchmarks
- [ ] Implement automated regression tests
```

### NEW: 3.6 Advanced Accessibility (Week 6)
```typescript
// Priority tasks:
- [ ] Add screen reader support
- [ ] Implement motion reduction options
- [ ] Create comprehensive control hints
- [ ] Add visual indicators for audio cues
```

---

## Phase 4: Extended Features (Optional)
**Goal**: Add multiplayer and advanced features  
**Duration**: 2-4 weeks  
**Outcome**: Full-featured racing game

### 4.1 Multiplayer Support
- WebSocket infrastructure
- State synchronization
- Lobby system
- Matchmaking

### 4.2 Advanced Features
- Track editor
- Ghost replay system
- Tournament mode
- Leaderboards

### 4.3 Platform Support
- Mobile controls
- Gamepad support
- Cloud saves
- Achievements

---

## Implementation Strategy

### Week-by-Week Breakdown - REVISED

**Week 1**: Architecture & Race Core
- Monday: Architecture foundation (EventBus, error handling)
- Tuesday: Refactor Game class, set up tests
- Wednesday-Thursday: RaceManager & basic HUD
- Friday: Basic AI for testing, integration

**Week 2**: Playable MVP
- Monday-Tuesday: Parallel work (Audio + Menu systems)
- Wednesday: Error handling & performance monitoring
- Thursday: Integration and testing
- Friday: Phase 1 complete, playable demo

**Week 3**: AI & Network Design
- Monday-Tuesday: Network architecture design (no implementation)
- Wednesday-Thursday: Enhanced AI implementation
- Friday: Start item system

**Week 4**: Items & Features
- Monday-Tuesday: Complete item system
- Wednesday: Character integration
- Thursday: Save system + Analytics foundation
- Friday: Basic accessibility features

**Week 5**: Architecture & Performance
- Monday-Tuesday: Architecture refactoring if needed
- Wednesday-Thursday: Performance optimization & Web Workers
- Friday: UI/UX improvements

**Week 6**: Testing & Polish
- Monday: Comprehensive testing suite
- Tuesday: Advanced accessibility
- Wednesday-Thursday: Additional content
- Friday: Release preparation

---

## Development Guidelines

### For Each Feature:
1. **Design First**: Create interface/types
2. **Test Driven**: Write tests before implementation
3. **Incremental**: Implement MVP, then enhance
4. **Document**: Update CLAUDE.md with new systems
5. **Integrate**: Merge frequently to main branch

### Code Structure Template:
```typescript
// 1. Create interface
interface IRaceManager {
  startRace(): void;
  updatePositions(): void;
  // ...
}

// 2. Write tests
describe('RaceManager', () => {
  it('should track lap completion', () => {
    // Test implementation
  });
});

// 3. Implement class
class RaceManager implements IRaceManager {
  // Implementation
}
```

### Daily Workflow:
1. Review current phase goals
2. Pick next task from roadmap
3. Write tests for feature
4. Implement feature
5. Integrate and test
6. Update documentation

---

## Success Metrics

### Phase 1 Complete:
- [ ] Can complete full race
- [ ] See lap times and position
- [ ] Hear engine and UI sounds
- [ ] Navigate menus

### Phase 2 Complete:
- [ ] Race against AI opponents
- [ ] Use items strategically
- [ ] Play as different characters
- [ ] Progress saves between sessions

### Phase 3 Complete:
- [ ] Consistent 60 FPS
- [ ] No memory leaks
- [ ] Smooth UI transitions
- [ ] Multiple tracks available

### Phase 4 Complete:
- [ ] Online multiplayer works
- [ ] Cross-platform support
- [ ] Community features active
- [ ] Regular content updates

---

## Risk Mitigation

### Technical Risks:
- **Performance Issues**: Profile early and often
- **Browser Compatibility**: Test on multiple browsers
- **Physics Bugs**: Extensive testing, safety limits
- **Memory Leaks**: Regular profiling, object pooling

### Schedule Risks:
- **Feature Creep**: Stick to phase goals
- **Integration Issues**: Merge frequently
- **Testing Delays**: Automate where possible
- **Asset Creation**: Use placeholders first

---

## Conclusion
This roadmap transforms Business Cat Racing from a tech demo to a full-featured racing game. Each phase delivers tangible value while building toward the complete vision. The modular approach allows for adjusting scope based on time and resources while ensuring a playable game at each milestone.