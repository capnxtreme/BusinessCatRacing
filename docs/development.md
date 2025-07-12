# Development Setup and Guidelines

## Prerequisites

### Required Software
- **Node.js:** v18.0.0 or higher
- **npm:** v8.0.0 or higher (or yarn v1.22.0+)
- **Git:** Latest version
- **Code Editor:** VS Code recommended with extensions:
  - TypeScript
  - Prettier
  - ESLint
  - Three.js Snippets

### Recommended Hardware
- **RAM:** 16GB minimum for development
- **GPU:** WebGL 2.0 compatible graphics card
- **Storage:** 5GB free space for assets and dependencies
- **Display:** 1920x1080 minimum for testing different resolutions

## Project Setup

### Initial Installation
```bash
# Clone the repository
git clone [repository-url]
cd BusinessCatRacing

# Install dependencies
npm install

# Set up development environment
npm run setup

# Start development server
npm run dev
```

### Environment Configuration
Create `.env.local` file in project root:
```
# MCP DALL-E Configuration
MCP_DALLE_ENDPOINT=your_dalle_mcp_endpoint
MCP_DALLE_API_KEY=your_api_key

# Development Settings
NODE_ENV=development
DEBUG_PHYSICS=false
DEBUG_RENDERING=false
ENABLE_PERFORMANCE_MONITORING=true

# Asset Generation
ENABLE_DALLE_GENERATION=true
ASSET_CACHE_TTL=3600000
```

## Development Workflow

### Test-Driven Development (TDD)

#### TDD Cycle
1. **Red:** Write a failing test
2. **Green:** Write minimal code to pass
3. **Refactor:** Improve code quality
4. **Repeat:** Continue with next feature

#### Example TDD Workflow
```bash
# 1. Write failing test
npm run test:watch

# 2. Implement feature to pass test
# Edit source files

# 3. Verify test passes
npm run test

# 4. Refactor if needed
npm run lint:fix

# 5. Run full test suite
npm run test:full
```

### Git Workflow

#### Branch Strategy
- **main:** Production-ready code
- **develop:** Integration branch for features
- **feature/[name]:** Individual features
- **bugfix/[name]:** Bug fixes
- **hotfix/[name]:** Critical production fixes

#### Commit Guidelines
```bash
# Format: <type>(<scope>): <description>
feat(kart): add drift physics implementation
fix(ui): resolve menu navigation bug
test(physics): add collision detection tests
docs(readme): update installation instructions
```

#### Pull Request Process
1. Create feature branch from develop
2. Implement feature with tests
3. Run full test suite and linting
4. Create PR with clear description
5. Code review and approval
6. Merge to develop

### Code Style Guidelines

#### TypeScript Standards
```typescript
// Use explicit types for function parameters and returns
function calculateLapTime(startTime: number, endTime: number): number {
  return endTime - startTime;
}

// Use interfaces for object shapes
interface KartConfiguration {
  speed: number;
  acceleration: number;
  handling: number;
  weight: number;
}

// Use enums for constants
enum GameState {
  MENU = 'menu',
  RACING = 'racing',
  PAUSED = 'paused',
  FINISHED = 'finished'
}
```

#### File Naming Conventions
- **Components:** PascalCase (e.g., `GameRenderer.ts`)
- **Utilities:** camelCase (e.g., `mathUtils.ts`)
- **Tests:** `*.test.ts` or `*.spec.ts`
- **Types:** `*.types.ts`
- **Constants:** `*.constants.ts`

#### Directory Structure Guidelines
```
src/
├── components/          # Reusable components
├── systems/            # Game systems (physics, rendering, etc.)
├── entities/           # Game entities (kart, character, etc.)
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── constants/          # Application constants
├── assets/             # Asset management
└── tests/              # Test utilities and mocks
```

## Testing Strategy

### Unit Testing with Jest

#### Test File Structure
```typescript
// kart.test.ts
import { Kart } from '../entities/Kart';
import { KartConfiguration } from '../types/kart.types';

describe('Kart', () => {
  let kart: Kart;
  let config: KartConfiguration;

  beforeEach(() => {
    config = {
      speed: 7,
      acceleration: 8,
      handling: 7,
      weight: 6
    };
    kart = new Kart(config);
  });

  describe('acceleration', () => {
    it('should increase velocity when accelerating', () => {
      const initialVelocity = kart.velocity;
      kart.accelerate(1.0); // 1 second
      expect(kart.velocity).toBeGreaterThan(initialVelocity);
    });

    it('should respect maximum speed limits', () => {
      // Accelerate for long time
      for (let i = 0; i < 100; i++) {
        kart.accelerate(0.1);
      }
      expect(kart.velocity).toBeLessThanOrEqual(kart.maxSpeed);
    });
  });
});
```

#### Test Categories
- **Unit Tests:** Individual functions and classes
- **Integration Tests:** System interactions
- **Visual Tests:** Rendering output verification
- **Performance Tests:** Frame rate and memory usage

### Testing Commands
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test kart.test.ts

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance
```

### Mock Data and Fixtures
```typescript
// tests/fixtures/kart.fixtures.ts
export const mockKartConfig: KartConfiguration = {
  speed: 7,
  acceleration: 8,
  handling: 7,
  weight: 6
};

export const mockCharacter: Character = {
  name: 'Business Cat',
  species: 'cat',
  specialAbility: 'quarterlyReport'
};
```

## Asset Development

### 3D Model Pipeline
1. **Concept:** DALL-E generated concept art
2. **Modeling:** Create 3D models based on concepts
3. **Texturing:** Apply generated textures
4. **Optimization:** LOD creation and polygon reduction
5. **Integration:** Import into Three.js format

### Texture Generation with DALL-E
```typescript
// Asset generation workflow
async function generateCharacterTexture(character: string): Promise<string> {
  const prompt = `Professional ${character} wearing business attire, high quality texture, game asset`;
  const texture = await mcpClient.generateTexture(prompt, '512x512');
  return optimizeTexture(texture);
}
```

### Asset Optimization
- **Textures:** Compress to WebP/AVIF when possible
- **Models:** Use GLTF format with Draco compression
- **Audio:** Compress to OGG Vorbis for web delivery
- **Caching:** Implement efficient browser caching strategy

## Performance Monitoring

### Metrics to Track
- **Frame Rate:** Target 60 FPS minimum
- **Memory Usage:** Monitor for memory leaks
- **Asset Loading:** Track loading times
- **Physics Performance:** Collision detection timing
- **Render Performance:** Draw call optimization

### Performance Tools
```bash
# Enable performance monitoring
npm run dev:performance

# Generate performance report
npm run analyze

# Profile memory usage
npm run profile:memory

# Benchmark physics systems
npm run benchmark:physics
```

### Performance Optimization Guidelines
1. **Avoid Creating Objects in Game Loop:** Pre-allocate when possible
2. **Use Object Pooling:** For frequently created/destroyed objects
3. **Implement LOD System:** Reduce detail for distant objects
4. **Optimize Shaders:** Use efficient GLSL code
5. **Batch Rendering:** Minimize draw calls

## Debugging

### Debug Mode Features
```typescript
// Enable debug rendering
const DEBUG_CONFIG = {
  showPhysicsWireframes: true,
  showBoundingBoxes: true,
  showPerformanceStats: true,
  logPhysicsEvents: true
};
```

### Debugging Tools
- **Three.js Inspector:** Browser extension for 3D debugging
- **Physics Debug Renderer:** Visualize collision shapes
- **Performance Monitor:** Real-time FPS and memory tracking
- **Console Commands:** In-game debugging commands

### Common Debugging Scenarios
```typescript
// Debug kart physics
console.log('Kart velocity:', kart.velocity);
console.log('Kart position:', kart.position);
console.log('Physics body:', kart.physicsBody);

// Debug rendering
renderer.debug.showWireframes = true;
scene.debug.showBoundingBoxes = true;

// Debug AI behavior
aiController.debug.showPath = true;
aiController.debug.logDecisions = true;
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run build
```

### Quality Gates
- **Test Coverage:** Minimum 80% coverage required
- **Linting:** Zero ESLint errors
- **Type Checking:** Zero TypeScript errors
- **Performance:** No performance regressions
- **Security:** No high-severity vulnerabilities

## Deployment

### Build Process
```bash
# Production build
npm run build

# Preview production build
npm run preview

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### Environment-Specific Configurations
- **Development:** Full debugging, hot reload
- **Staging:** Production build with debug info
- **Production:** Optimized build, minimal logging

## Team Collaboration

### Code Review Guidelines
1. **Functionality:** Does the code work as intended?
2. **Tests:** Are there adequate tests?
3. **Performance:** Any performance implications?
4. **Maintainability:** Is the code readable and maintainable?
5. **Security:** Any security concerns?

### Documentation Requirements
- **Code Comments:** Document complex algorithms
- **API Documentation:** Document public interfaces
- **Architecture Decisions:** Record significant decisions
- **Setup Instructions:** Keep setup docs updated

### Communication Channels
- **Daily Standups:** Progress and blockers
- **Code Reviews:** Technical discussions
- **Architecture Decisions:** Team consensus on major changes
- **Bug Reports:** Clear reproduction steps

## Troubleshooting

### Common Issues
1. **WebGL Context Lost:** Implement context restoration
2. **Memory Leaks:** Profile and fix object retention
3. **Performance Drops:** Identify bottlenecks with profiler
4. **Asset Loading Failures:** Implement retry logic
5. **Physics Instability:** Tune physics parameters

### Getting Help
- **Documentation:** Check docs/ directory first
- **Issue Tracker:** Search existing issues
- **Team Members:** Ask for pair programming
- **Community:** Three.js and game development forums