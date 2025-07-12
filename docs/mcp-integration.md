# MCP DALL-E Integration Design

## Overview

This document outlines the integration of DALL-E image generation through the Model Context Protocol (MCP) for dynamic asset creation in Business Cat Racing. The MCP server will handle AI-generated textures, sprites, and environmental assets.

## MCP Architecture

### MCP Server Configuration
```json
{
  "name": "dalle-asset-generator",
  "version": "1.0.0",
  "description": "DALL-E integration for Business Cat Racing asset generation",
  "capabilities": {
    "tools": [
      "generate_character_texture",
      "generate_track_element",
      "generate_kart_design",
      "generate_environment_texture",
      "generate_ui_element"
    ],
    "resources": [
      "asset_templates",
      "style_guidelines",
      "generation_history"
    ]
  }
}
```

### MCP Client Integration
```typescript
// src/mcp/client.ts
import { MCPClient } from '@modelcontextprotocol/client';

export class DalleAssetClient {
  private client: MCPClient;
  private basePrompts: Map<string, string>;

  constructor(endpoint: string, apiKey: string) {
    this.client = new MCPClient({
      endpoint,
      authentication: { apiKey }
    });
    this.initializeBasePrompts();
  }

  async generateCharacterTexture(
    character: string, 
    pose: string = 'neutral',
    resolution: string = '512x512'
  ): Promise<GeneratedAsset> {
    const prompt = this.buildCharacterPrompt(character, pose);
    return await this.client.callTool('generate_character_texture', {
      prompt,
      resolution,
      style: 'corporate_cartoon',
      format: 'png'
    });
  }

  async generateTrackTexture(
    environment: string,
    surface: string,
    resolution: string = '1024x1024'
  ): Promise<GeneratedAsset> {
    const prompt = this.buildTrackPrompt(environment, surface);
    return await this.client.callTool('generate_track_element', {
      prompt,
      resolution,
      tileable: true,
      format: 'webp'
    });
  }
}
```

## Asset Generation Categories

### 1. Character Assets

#### Character Portraits
**Purpose:** Menu displays, character selection  
**Specifications:**
- Resolution: 512x512px
- Format: PNG with transparency
- Style: Corporate cartoon, professional lighting

**Generation Prompts:**
```typescript
const characterPrompts = {
  businessCat: {
    base: "Professional black cat wearing red business tie",
    variations: {
      neutral: "serious expression, sitting upright, office background",
      racing: "determined expression, wearing racing helmet with tie visible",
      victory: "celebratory pose holding trophy, confetti background",
      defeat: "disappointed expression, paws on hips, office setting"
    }
  },
  executiveDog: {
    base: "Golden retriever wearing navy business suit",
    variations: {
      neutral: "friendly professional smile, paws folded, corporate office",
      racing: "excited expression, tongue out, racing gear over suit",
      victory: "triumphant howl, trophy raised high, cheering background",
      defeat: "sad puppy eyes, ears drooped, consolation background"
    }
  }
  // ... additional characters
};
```

#### Character Textures for 3D Models
**Purpose:** UV mapping for 3D character models  
**Specifications:**
- Resolution: 1024x1024px
- Format: WebP for optimization
- UV Layout: Standard humanoid mapping

### 2. Track Assets

#### Environment Textures
**Purpose:** Track surfaces, walls, decorative elements  
**Specifications:**
- Resolution: 512x512px to 2048x2048px
- Format: WebP with normal maps
- Tileable: Yes for repeating surfaces

**Generation Categories:**
```typescript
const trackAssets = {
  surfaces: {
    officeCarpet: "Corporate office carpet, blue-gray pattern, seamless tile",
    marbleFloor: "Polished marble floor, corporate lobby style, reflective",
    asphalt: "Clean asphalt road surface, corporate campus style",
    concretePark: "Concrete parking garage floor, painted lines visible"
  },
  walls: {
    officeWalls: "Modern office walls, white paint, corporate design",
    glassWalls: "Floor-to-ceiling office glass walls, reflective",
    cubicleWalls: "Office cubicle partitions, beige fabric covered",
    exteriorWalls: "Corporate building exterior, glass and steel"
  },
  decorative: {
    corporateLogo: "Generic corporate logo, professional design",
    officePlants: "Corporate office plants in modern planters",
    artWork: "Corporate office artwork, abstract professional style",
    signage: "Office building signage, wayfinding style"
  }
};
```

#### Track Elements
**Purpose:** Interactive objects, obstacles, decorations  
**Specifications:**
- Resolution: Variable based on use
- Format: PNG with transparency for objects
- Style: Consistent with corporate theme

### 3. Kart Customization Assets

#### Kart Designs
**Purpose:** Different kart styles and customization options  
**Specifications:**
- Resolution: 1024x1024px
- Format: PNG with transparency
- Viewpoints: Multiple angles for 3D reconstruction

**Kart Categories:**
```typescript
const kartDesigns = {
  officeChair: "Modern office chair converted to go-kart, wheels attached",
  golfCart: "Corporate golf cart miniaturized, business styling",
  deliveryCart: "Office mail delivery cart with racing modifications",
  executiveSedan: "Miniature luxury sedan, corporate executive style"
};
```

### 4. UI and HUD Elements

#### Interface Graphics
**Purpose:** Menu backgrounds, buttons, HUD elements  
**Specifications:**
- Resolution: Variable (256x256px to 1920x1080px)
- Format: PNG with transparency
- Style: Corporate design language

**UI Categories:**
```typescript
const uiAssets = {
  backgrounds: {
    mainMenu: "Corporate boardroom background, professional lighting",
    characterSelect: "Office environment, multiple workstations",
    trackSelect: "Corporate campus overview, aerial view",
    garage: "Executive parking garage, luxury setting"
  },
  buttons: {
    primary: "Corporate blue button, professional styling",
    secondary: "Corporate gray button, subtle design",
    danger: "Corporate red button, warning style",
    success: "Corporate green button, achievement style"
  },
  icons: {
    speed: "Speedometer icon, corporate dashboard style",
    handling: "Steering wheel icon, professional design",
    acceleration: "Rocket icon, business appropriate",
    weight: "Scale icon, corporate styling"
  }
};
```

## Generation Pipeline

### 1. Asset Request Flow
```typescript
// Asset generation workflow
class AssetGenerationPipeline {
  async generateAsset(request: AssetRequest): Promise<ProcessedAsset> {
    // 1. Validate request parameters
    this.validateRequest(request);
    
    // 2. Check cache for existing asset
    const cached = await this.checkCache(request);
    if (cached) return cached;
    
    // 3. Generate base prompt
    const prompt = this.buildPrompt(request);
    
    // 4. Call DALL-E via MCP
    const rawAsset = await this.mcpClient.generate(prompt, request.specs);
    
    // 5. Post-process generated asset
    const processed = await this.postProcess(rawAsset, request.specs);
    
    // 6. Cache processed asset
    await this.cacheAsset(request, processed);
    
    // 7. Return ready-to-use asset
    return processed;
  }
}
```

### 2. Post-Processing Pipeline
```typescript
class AssetPostProcessor {
  async process(rawAsset: RawAsset, specs: AssetSpecs): Promise<ProcessedAsset> {
    let processed = rawAsset;
    
    // Resize if needed
    if (specs.resolution !== rawAsset.resolution) {
      processed = await this.resize(processed, specs.resolution);
    }
    
    // Optimize format
    processed = await this.optimizeFormat(processed, specs.format);
    
    // Generate mipmaps for textures
    if (specs.type === 'texture') {
      processed.mipmaps = await this.generateMipmaps(processed);
    }
    
    // Create normal maps if needed
    if (specs.generateNormalMap) {
      processed.normalMap = await this.generateNormalMap(processed);
    }
    
    // Validate final asset
    await this.validateProcessedAsset(processed, specs);
    
    return processed;
  }
}
```

### 3. Caching Strategy
```typescript
class AssetCache {
  private cache: Map<string, CachedAsset>;
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  async get(request: AssetRequest): Promise<ProcessedAsset | null> {
    const key = this.generateKey(request);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.asset;
  }

  async set(request: AssetRequest, asset: ProcessedAsset): Promise<void> {
    const key = this.generateKey(request);
    this.cache.set(key, {
      asset,
      timestamp: Date.now(),
      size: asset.byteLength
    });
    
    // Cleanup old entries if cache is too large
    await this.cleanup();
  }
}
```

## Quality Assurance

### Asset Validation
```typescript
interface AssetValidator {
  validateResolution(asset: ProcessedAsset, expected: string): boolean;
  validateFormat(asset: ProcessedAsset, expected: string): boolean;
  validateFileSize(asset: ProcessedAsset, maxSize: number): boolean;
  validateStyle(asset: ProcessedAsset, styleGuide: StyleGuide): boolean;
}
```

### Style Consistency
- **Color Palette:** Corporate blues, grays, whites with accent colors
- **Lighting:** Professional, even lighting with subtle shadows
- **Composition:** Clean, uncluttered designs
- **Brand Alignment:** Consistent with Business Cat aesthetic

### Performance Considerations
- **File Size Limits:** Maximum sizes per asset type
- **Generation Time:** Target under 30 seconds per asset
- **Concurrent Requests:** Limit simultaneous generations
- **Error Handling:** Graceful fallbacks to static assets

## Error Handling and Fallbacks

### Fallback Asset System
```typescript
class FallbackAssetManager {
  private staticAssets: Map<string, StaticAsset>;

  async getAsset(request: AssetRequest): Promise<ProcessedAsset> {
    try {
      // Try to generate via DALL-E
      return await this.dalleClient.generateAsset(request);
    } catch (error) {
      console.warn('DALL-E generation failed, using fallback:', error);
      
      // Use pre-created static asset
      const fallback = this.staticAssets.get(request.type);
      if (fallback) {
        return this.adaptStaticAsset(fallback, request.specs);
      }
      
      // Generate procedural fallback
      return this.generateProceduralFallback(request);
    }
  }
}
```

### Error Recovery Strategies
1. **Network Issues:** Retry with exponential backoff
2. **Generation Failures:** Use static alternatives
3. **Invalid Content:** Regenerate with modified prompts
4. **Rate Limiting:** Queue requests and process when available
5. **Quality Issues:** Automatic regeneration with refined prompts

## Development and Testing

### Mock MCP Server
```typescript
// For development without DALL-E access
class MockDalleClient implements DalleAssetClient {
  async generateCharacterTexture(character: string): Promise<GeneratedAsset> {
    // Return static test assets that match expected format
    return {
      data: await this.loadTestAsset(`mock-${character}.png`),
      metadata: {
        prompt: `Mock ${character} texture`,
        resolution: '512x512',
        format: 'png'
      }
    };
  }
}
```

### Integration Testing
- **MCP Connection:** Verify server connectivity
- **Asset Generation:** Test all asset types
- **Performance:** Monitor generation times
- **Quality:** Validate generated assets meet standards
- **Fallbacks:** Test error handling scenarios

## Deployment Configuration

### Production MCP Setup
```yaml
# MCP server configuration
mcp_server:
  endpoint: "https://mcp.businesscatracing.com/dalle"
  api_key: "${DALLE_API_KEY}"
  rate_limit: 100 # requests per minute
  timeout: 30000 # 30 seconds
  retry_attempts: 3
  cache_ttl: 86400000 # 24 hours
```

### Environment Variables
```bash
# Production
MCP_DALLE_ENDPOINT=https://mcp.businesscatracing.com/dalle
MCP_DALLE_API_KEY=your_production_key
ASSET_CACHE_SIZE=1000
ENABLE_ASSET_GENERATION=true

# Development
MCP_DALLE_ENDPOINT=http://localhost:3001/dalle
MCP_DALLE_API_KEY=dev_key
ASSET_CACHE_SIZE=100
ENABLE_ASSET_GENERATION=false
```