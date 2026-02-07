# Architecture Research: Gesture-Based Web Game

**Project:** AETHOS: Fragments of the Void
**Domain:** React + Canvas web game with real-time gesture recognition
**Researched:** 2026-02-06
**Confidence:** HIGH (verified with current sources and established patterns)

## System Overview

The architecture follows a **hybrid React UI + Canvas game engine pattern**, where React manages application state, UI overlays, and navigation while a Canvas-based game engine handles real-time rendering, physics, and game loop. The two layers communicate through a shared state management bridge.

```
┌─────────────────────────────────────────────────────────┐
│                    React App Layer                       │
│  (Routing, Menus, HUD, Overlays, Settings)              │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Main Menu    │  │ Game HUD     │  │ Stats Screen │ │
│  │ (existing)   │  │ (overlay)    │  │ (post-level) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ State Bridge (useRef + callbacks)
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Canvas Game Engine Layer                    │
│  (Game Loop, Rendering, Physics, Collisions)            │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Game Manager │  │ Entity       │  │ Render       │ │
│  │ (controller) │──│ Systems      │──│ Pipeline     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         ▼                  ▼                  ▼         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Input System │  │ Gesture Rec. │  │ Spell System │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ Web Worker messaging
                           ▼
┌─────────────────────────────────────────────────────────┐
│        Gesture Recognition Worker (Off-thread)          │
│   ($1 Recognizer → TensorFlow.js ML recognition)       │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### Game Engine (Canvas)

**Responsibility:** Game loop, entity management, physics, rendering, collision detection

**Key Classes/Modules:**
- `GameEngine`: Main orchestrator, owns the game loop (requestAnimationFrame), coordinates systems
- `EntityManager`: Manages all game entities (player projectiles, enemies, particles, hazards)
- `PhysicsSystem`: Updates positions, velocities, collision detection (AABB for projectiles/enemies)
- `RenderPipeline`: Draws entities, particles, effects to canvas with layering (background → entities → particles → UI effects)
- `CollisionSystem`: Quadtree or spatial hash for efficient collision checks
- `ParticleSystem`: Object pooling for spell effects, hit particles, ambient effects

**Data Structure:**
- Entities use a component-like structure (not full ECS for hackathon speed, but data-oriented)
- Each entity has: `{ id, type, x, y, vx, vy, hp, maxHp, radius, color, ...componentData }`
- Systems iterate over entity arrays, updating relevant entities per frame

**Canvas Setup:**
- Fixed-size logical canvas (e.g., 1920x1080) scaled to viewport via CSS
- Off-screen canvas for particle pre-rendering (if needed for performance)
- Context settings: `imageSmoothingEnabled = false` for crisp pixel-perfect rendering

**Game Loop Pattern:** Fixed timestep accumulator with variable rendering (see Game Loop section below)

### UI Layer (React)

**Responsibility:** Navigation, menus, HUD overlays, settings, post-level screens

**Component Hierarchy:**
```
<App> (Router)
  ├─ <HomePage> (existing main menu)
  ├─ <GamePage>
  │   ├─ <GameCanvas> (canvas ref, game engine mounted here)
  │   ├─ <GameHUD> (HP, mana, spell bar, accuracy feedback)
  │   ├─ <PauseMenu> (overlay)
  │   └─ <TutorialOverlay> (levels 1-15 warnings)
  ├─ <StatsScreen> (post-level)
  ├─ <LoadoutScreen> (pre-level spell selection)
  ├─ <UpgradeScreen> (between levels)
  ├─ <SettingsPage>
  └─ <ArchivesPage>
```

**State Management:**
- **Local component state** for UI-only concerns (menu open/closed, animations)
- **Game state bridge** via `useRef` to game engine instance (no re-renders on every frame)
- **React Context** for global settings (difficulty, accessibility, colorblind mode)
- **LocalStorage** for save data, upgrades, unlocked levels

**Styling:**
- Tailwind CSS for utility classes (consistent with existing main menu)
- Existing color palette: `bg-[#0a0a12]`, `text-[#f4e8c1]`, `accent-[#7eb8da]`, `accent-[#4a8f8f]`
- Fonts: Cinzel Decorative (titles), Cormorant Garamond (body)

**Integration Pattern:**
- React renders UI, Canvas renders game
- Canvas is a `<canvas ref={canvasRef}>` element inside `<GamePage>`
- Game engine instance created in `useEffect`, stored in `useRef` (not React state)
- HUD reads from game engine via polling (e.g., `setInterval` or `requestAnimationFrame` callback updates React state for display)

### Gesture Recognition System

**Responsibility:** Capture mouse/touch input, recognize shapes, extract trajectories

**Architecture:**
- **Input Capture (Main Thread):** Listen for `mousedown`, `mousemove`, `mouseup` or `touchstart`, `touchmove`, `touchend`
- **Path Recording:** Store `[{x, y, timestamp}]` array of input points during drawing
- **Shape Recognition (Web Worker):** Offload recognition to avoid blocking game loop
  - Start with **$1 Recognizer** (lightweight, rule-based, fast to implement)
  - Path sent to worker via `postMessage`, worker returns `{ shapeName, score }`
  - Upgrade to **TensorFlow.js** if time permits (pre-trained model or fine-tuned on custom gestures)
- **Trajectory Extraction (Main Thread):** After shape recognized, continue capturing path for aiming (post-recognition points = trajectory)
- **Feedback Loop:** Drawing trail rendered on canvas in real-time, shape match shown with visual confirmation

**Gesture Types:**
- Circle → Quick Shot
- Triangle → Magic Missile
- Zigzag → Fireball
- Swipe (straight line) → Shield
- Spiral → Life Drain
- Circle-dot (circle then tap center) → Time Slow
- Horizontal swipe + hold → Dash
- Star + circles → Meteor Storm (ultimate)

**Accuracy Scoring:**
- Recognition confidence (0.0-1.0) maps to damage multiplier (0.5x-1.0x)
- Display accuracy feedback on HUD ("Perfect!", "Good", "Sloppy")

**Web Worker Communication:**
```javascript
// Main thread sends:
worker.postMessage({ type: 'recognize', path: [{x, y}...] });

// Worker responds:
self.postMessage({ type: 'result', shape: 'circle', confidence: 0.92 });
```

### Spell System

**Responsibility:** Execute spell effects, manage spell state, apply accuracy modifiers

**Data Structure:**
```javascript
const spellDefinitions = {
  quickShot: {
    type: 'FREE',
    manaCost: 0,
    gesture: 'circle',
    damage: 25,
    speed: 800,
    projectileCount: 1,
    color: '#7eb8da',
    cooldown: 0,
  },
  magicMissile: {
    type: 'FREE',
    manaCost: 0,
    gesture: 'triangle',
    damage: 15,
    speed: 600,
    projectileCount: 3,
    spreadAngle: 15,
    color: '#7eb8da',
    cooldown: 0,
  },
  shield: {
    type: 'UTILITY',
    manaCost: 35,
    gesture: 'swipe',
    duration: 5000,
    absorbAmount: 100,
    color: '#a855f7',
    cooldown: 2000,
  },
  meteorStorm: {
    type: 'ULTIMATE',
    manaCost: 100,
    gesture: 'star_circles',
    damage: 200,
    aoeRadius: 300,
    meteorCount: 12,
    color: '#f59e0b',
    cooldown: 5000,
  },
  // ... other spells
};
```

**Spell Execution Flow:**
1. Gesture recognized → Check mana cost and cooldown
2. If castable → Deduct mana, spawn projectile(s)/effect entity
3. Apply accuracy modifier to damage/duration
4. Add trajectory velocity to projectiles (extracted from continued drawing)
5. Start cooldown timer
6. Trigger visual effects (particles, screen shake, trail)

**Spell Categories:**
- **Free Spells (0 mana):** Quick Shot, Magic Missile, Fireball — always available
- **Utility Spells (35 mana):** Shield, Life Drain, Time Slow, Dash — choose 2 in loadout
- **Ultimate (100 mana):** Meteor Storm — high-impact AoE

**Component Pattern:**
- `SpellManager` class with methods: `castSpell(spellId, trajectory, accuracy)`, `update(dt)` (tick cooldowns), `isCastable(spellId)`
- Spell effects create entities managed by `EntityManager`

### Enemy System

**Responsibility:** Spawn enemies, AI behaviors, health management, drop loot

**Enemy Types:**
```javascript
const enemyTypes = {
  slime: {
    hp: 50,
    speed: 100,
    damage: 10,
    behavior: 'chase', // Simple follow player
    color: '#22c55e',
    radius: 20,
    lootMana: 5,
  },
  turret: {
    hp: 80,
    speed: 0,
    damage: 15,
    behavior: 'ranged', // Shoot projectiles at player
    fireRate: 2000, // ms between shots
    color: '#ef4444',
    radius: 25,
    lootMana: 8,
  },
  fastZombie: {
    hp: 30,
    speed: 250,
    damage: 15,
    behavior: 'chase',
    color: '#a855f7',
    radius: 18,
    lootMana: 10,
  },
  boss: {
    hp: 500,
    speed: 80,
    damage: 30,
    behavior: 'boss_pattern', // Multi-phase, special attacks
    color: '#dc2626',
    radius: 50,
    lootMana: 50,
  },
  hazard: {
    hp: Infinity,
    speed: 0,
    damage: 20, // Damage per second in contact
    behavior: 'static',
    types: ['lava', 'poison_cloud', 'falling_debris'],
    color: '#f97316',
    radius: 40,
  },
};
```

**AI Behaviors:**
- **Chase:** Move toward player at constant speed, simple steering
- **Ranged:** Stay at distance, shoot projectiles periodically with attack warning (visual telegraph)
- **Boss Pattern:** State machine (idle → telegraph attack → execute → cooldown → repeat)
- **Static Hazard:** No movement, damage on collision/overlap

**Wave Spawning:**
- `LevelManager` defines spawn patterns per level (wave composition, timing, spawn positions)
- Waves spawn at screen edges or designated spawn zones
- Boss levels spawn single boss entity with special mechanics

**Visual Language:**
- Color coding: Green (weak), Red (dangerous), Purple (fast), Boss (crimson + larger)
- Attack warnings: Flash + outline before turret shot, boss telegraph area-of-effect

**Component:**
- `EnemyManager` class: `spawnEnemy(type, x, y)`, `updateAI(dt)`, `handleCollisions()`, `dropLoot(enemy)`
- Each enemy entity has AI state: `{ behavior, target, attackTimer, moveDirection, ... }`

### Resource/Mana System

**Responsibility:** Track player mana, passive regen, kill bonuses, visual thresholds

**Mana Mechanics:**
- **Starting Mana:** 50 (enough for one utility spell at start)
- **Max Mana:** 100 (base), upgradeable to 150
- **Passive Regen:** 5 mana/sec (base), upgradeable to 10 mana/sec
- **Kill Bonus:** Variable per enemy type (5-50 mana)
- **Spell Costs:** Free (0), Utility (35), Ultimate (100)

**Visual Thresholds:**
- Mana bar segments: 0-35 (blue), 35-100 (purple glow), 100 (gold glow + pulse)
- HUD indicators: "Utility Ready" at 35+, "Ultimate Ready" at 100

**Difficulty Scaling:**
- Easy: +50% mana regen, -25% spell costs
- Normal: Base values
- Hard: -50% mana regen, +25% spell costs

**Component:**
- `ManaSystem` class: `current`, `max`, `regenRate`, `add(amount)`, `spend(amount)`, `canAfford(cost)`, `update(dt)`
- Tied to HUD via React state updates (throttled, e.g., 10 times/sec, not every frame)

### Level Manager

**Responsibility:** Load levels, track objectives, handle progression, spawn waves

**Level Data Structure:**
```javascript
const levels = [
  {
    id: 1,
    name: "First Steps",
    objective: "Defeat 5 slimes",
    tutorial: "Draw a circle to cast Quick Shot!",
    waves: [
      { enemies: [{ type: 'slime', count: 3 }], spawnDelay: 0 },
      { enemies: [{ type: 'slime', count: 2 }], spawnDelay: 5000 },
    ],
    hazards: [],
    timeLimit: null,
    completionReward: { xp: 100, coins: 50 },
  },
  // ... 19 more levels
  {
    id: 20,
    name: "Endless Mode Unlock",
    objective: "Defeat the Void Warden (Boss)",
    tutorial: null,
    waves: [{ enemies: [{ type: 'boss', count: 1 }], spawnDelay: 0 }],
    hazards: ['lava_ring'],
    timeLimit: null,
    completionReward: { unlockEndless: true },
  },
];

const endlessMode = {
  waveInterval: 30000, // New wave every 30 sec
  difficultyScaling: 1.1, // 10% more enemies/hp per wave
  randomSpawns: true,
};
```

**Tutorial Progression:**
- Levels 1-3: Free spells only (Quick Shot, Magic Missile, Fireball)
- Level 4: Introduce first utility spell (Shield)
- Levels 5-10: Mix of free + utilities, introduce fast enemies
- Levels 11-15: Introduce hazards, reduce on-screen warnings
- Levels 16-19: Complex combinations, high difficulty
- Level 20: Boss fight, unlock endless mode

**Level State Machine:**
- `LOADING` → `READY` → `ACTIVE` → `COMPLETE` / `FAILED` → `STATS_SCREEN`
- Transitions trigger React navigation (e.g., navigate to `/stats`)

**Component:**
- `LevelManager` class: `loadLevel(id)`, `checkObjective()`, `nextWave()`, `completeLevel()`, `failLevel()`
- Interacts with `EnemyManager` for spawning, `GameEngine` for state transitions

### Upgrade System

**Responsibility:** Apply permanent upgrades between levels, persist to localStorage

**Upgrade Categories:**
```javascript
const upgradeTrees = {
  mana: [
    { id: 'max_mana_1', name: 'Expanded Reserves', effect: { maxMana: +25 }, cost: 100 },
    { id: 'max_mana_2', name: 'Void Conduit', effect: { maxMana: +25 }, cost: 200, requires: 'max_mana_1' },
    { id: 'regen_1', name: 'Faster Regen', effect: { manaRegen: +2 }, cost: 150 },
  ],
  spellPower: [
    { id: 'damage_1', name: 'Empowered Spells', effect: { damageMult: 1.15 }, cost: 150 },
    { id: 'damage_2', name: 'Arcane Mastery', effect: { damageMult: 1.2 }, cost: 300, requires: 'damage_1' },
  ],
  spellEfficiency: [
    { id: 'cost_reduction', name: 'Efficient Casting', effect: { manaCostMult: 0.9 }, cost: 200 },
    { id: 'cooldown_reduction', name: 'Swift Casting', effect: { cooldownMult: 0.85 }, cost: 250 },
  ],
  ultimate: [
    { id: 'ultimate_damage', name: 'Meteor Fury', effect: { ultimateDamage: 1.5 }, cost: 300 },
    { id: 'ultimate_cooldown', name: 'Meteor Haste', effect: { ultimateCooldown: 0.75 }, cost: 300 },
  ],
};
```

**Upgrade Flow:**
- After level complete → Navigate to `<UpgradeScreen>`
- Display available upgrades (based on earned coins and requirements)
- Player selects upgrade → Apply to `GameEngine.playerStats`, deduct coins, save to localStorage
- Continue to next level

**Persistence:**
```javascript
// LocalStorage schema
{
  "playerProgress": {
    "unlockedLevels": 5,
    "coins": 450,
    "upgrades": ["max_mana_1", "damage_1", "regen_1"],
    "endlessUnlocked": false,
    "stats": { maxMana: 125, manaRegen: 7, damageMult: 1.15, ... }
  }
}
```

**Component:**
- `UpgradeManager` class: `getAvailableUpgrades()`, `applyUpgrade(id)`, `saveProgress()`, `loadProgress()`
- React component `<UpgradeScreen>` renders UI, calls upgrade methods

## Data Flow

### React UI ↔ Canvas Game Loop Communication

**Problem:** React's declarative state updates cause re-renders, but Canvas game loop runs at 60fps independent of React. Bridging these requires avoiding performance-killing re-renders.

**Solution: Direct State Management with useRef**

```javascript
// GamePage.jsx
function GamePage() {
  const canvasRef = useRef(null);
  const gameEngineRef = useRef(null);

  // HUD state updated at throttled rate (10Hz, not 60Hz)
  const [hudState, setHudState] = useState({ hp: 100, mana: 50, accuracy: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Create game engine instance (NOT in React state)
    gameEngineRef.current = new GameEngine(canvas, ctx, {
      onHudUpdate: (newHudState) => {
        // Callback from game loop to update React HUD (throttled)
        setHudState(newHudState);
      },
      onLevelComplete: (stats) => {
        // Navigate to stats screen
        navigate('/stats', { state: { stats } });
      },
    });

    // Start game loop (requestAnimationFrame)
    gameEngineRef.current.start();

    return () => {
      gameEngineRef.current.stop();
    };
  }, []);

  // React can call game engine methods directly
  const handlePause = () => {
    gameEngineRef.current.pause();
  };

  return (
    <div className="relative w-full h-screen">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <GameHUD {...hudState} onPause={handlePause} />
    </div>
  );
}
```

**Key Principles:**
1. **Canvas owns game state** — All entity positions, velocities, hp stored in game engine (NOT React state)
2. **useRef for engine instance** — Game engine lives outside React's reactivity system
3. **Callbacks for UI updates** — Game loop calls `onHudUpdate` at throttled rate (e.g., 10 times/sec)
4. **Direct method calls from React** — UI buttons call `gameEngineRef.current.pause()` directly
5. **Navigation events** — Game engine triggers React Router navigation on level complete/fail

**Data Flow Diagram:**
```
User Input (mouse/touch)
    │
    ▼
Game Engine (captures in game loop)
    │
    ├─► Gesture Worker (shape recognition) ──► Result ──► SpellSystem.cast()
    │
    ├─► EntityManager.update() ──► Physics ──► Collision ──► Damage
    │
    └─► onHudUpdate callback (throttled) ──► React setState ──► HUD re-renders
                                                                      │
                                                                      ▼
                                                             User sees HP/Mana update
```

### Example: Mana Update Flow

1. Enemy dies in game loop → `EnemyManager.handleDeath(enemy)`
2. `ManaSystem.add(enemy.lootMana)` → Updates `ManaSystem.current`
3. On next HUD update tick (every 100ms): `onHudUpdate({ mana: ManaSystem.current })`
4. React `setHudState({ mana: newValue })` → HUD component re-renders
5. Mana bar animates to new value (CSS transition)

**Why This Works:**
- Game loop remains unblocked (no React re-renders on every frame)
- HUD updates are batched and throttled (10Hz update is imperceptible to user)
- React components remain declarative and easy to style
- Game engine can be tested independently of React

## Game Loop Pattern

**Pattern: Fixed Timestep Accumulator with Variable Rendering**

This is the industry-standard approach for deterministic physics while maintaining smooth rendering on variable refresh rates.

**Implementation:**
```javascript
class GameEngine {
  constructor(canvas, ctx, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.callbacks = callbacks;

    // Fixed timestep for physics (60 updates/sec)
    this.fixedDt = 1000 / 60; // 16.667ms
    this.accumulator = 0;
    this.lastTime = 0;

    // Maximum frame time to prevent spiral of death
    this.maxFrameTime = 250; // 250ms (4fps minimum)

    this.running = false;
    this.animationFrameId = null;

    // Subsystems
    this.inputSystem = new InputSystem(canvas);
    this.entityManager = new EntityManager();
    this.physicsSystem = new PhysicsSystem();
    this.spellManager = new SpellManager();
    this.enemyManager = new EnemyManager();
    this.manaSystem = new ManaSystem();
    this.levelManager = new LevelManager();
    this.renderPipeline = new RenderPipeline(ctx);

    // HUD update throttle
    this.hudUpdateInterval = 100; // 10 times/sec
    this.lastHudUpdate = 0;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  loop = () => {
    if (!this.running) return;

    const currentTime = performance.now();
    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Clamp frame time to prevent spiral of death
    if (frameTime > this.maxFrameTime) {
      frameTime = this.maxFrameTime;
    }

    this.accumulator += frameTime;

    // Fixed timestep updates (may run 0, 1, or multiple times per frame)
    while (this.accumulator >= this.fixedDt) {
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    // Render (once per frame, with interpolation if needed)
    const alpha = this.accumulator / this.fixedDt;
    this.render(alpha);

    // Throttled HUD updates to React
    if (currentTime - this.lastHudUpdate >= this.hudUpdateInterval) {
      this.updateHUD();
      this.lastHudUpdate = currentTime;
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  update(dt) {
    // Process input
    const input = this.inputSystem.getInput();

    // Update systems in order (ORDER MATTERS)
    this.inputSystem.update(dt);
    this.spellManager.update(dt); // Tick cooldowns
    this.enemyManager.updateAI(dt); // Enemy movement/behavior
    this.physicsSystem.update(dt, this.entityManager.entities); // Positions, velocities
    this.collisionSystem.detectCollisions(this.entityManager.entities); // Damage, deaths
    this.manaSystem.update(dt); // Passive regen
    this.levelManager.checkObjectives(); // Win/lose conditions

    // Handle deaths, spawns
    this.entityManager.cleanup();
    this.levelManager.spawnNextWave(dt);
  }

  render(alpha) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render in layers
    this.renderPipeline.renderBackground();
    this.renderPipeline.renderEntities(this.entityManager.entities, alpha); // Interpolate if needed
    this.renderPipeline.renderParticles(this.entityManager.particles);
    this.renderPipeline.renderEffects(); // Screen shake, flashes
    this.renderPipeline.renderGestureTrail(this.inputSystem.currentPath);
  }

  updateHUD() {
    this.callbacks.onHudUpdate({
      hp: this.playerEntity.hp,
      maxHp: this.playerEntity.maxHp,
      mana: this.manaSystem.current,
      maxMana: this.manaSystem.max,
      accuracy: this.lastCastAccuracy,
      spellCooldowns: this.spellManager.getCooldowns(),
    });
  }
}
```

**Why This Pattern:**
- **Deterministic physics:** Fixed timestep ensures same simulation result regardless of frame rate
- **Smooth on variable refresh:** Works on 60Hz, 120Hz, 144Hz displays (requestAnimationFrame adapts)
- **No spiral of death:** Max frame time clamp prevents lag-induced slowdown loop
- **Separation of concerns:** Update (logic) separate from render (visuals)

**Optimization Notes:**
- For this hackathon game, full interpolation (`alpha`) may be overkill — can render without interpolation for simpler code
- If performance issues arise, reduce `fixedDt` updates to 30Hz (33.3ms) instead of 60Hz
- Profile with browser DevTools to identify bottlenecks (likely particle count or collision checks)

## React-Canvas Integration

### Pattern 1: Canvas as React Component Child

**Structure:**
```jsx
<div className="game-container">
  <canvas ref={canvasRef} className="game-canvas" />
  <GameHUD /> {/* Positioned absolutely over canvas */}
  <TutorialOverlay />
</div>
```

**CSS Layout:**
```css
.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.game-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* Fixed logical size, scaled via CSS */
  image-rendering: pixelated; /* Or crisp-edges for non-pixel art */
}

/* HUD overlays on top */
.hud-overlay {
  position: absolute;
  pointer-events: none; /* Let clicks pass through to canvas */
}
```

### Pattern 2: Separate Event Handling Layers

**Problem:** Canvas needs mouse events for gameplay, React needs them for UI (buttons, menus)

**Solution:**
- Canvas captures raw mouse/touch events for gesture drawing
- HUD elements set `pointer-events: auto` only on interactive zones (pause button, spell icons)
- Use `z-index` layering: Canvas (z-0) → HUD info (z-10, pointer-events: none) → Buttons (z-20, pointer-events: auto)

### Pattern 3: Controlled Game State Transitions

**Game Engine triggers React navigation:**
```javascript
// In GameEngine
levelComplete() {
  this.pause();
  this.callbacks.onLevelComplete({
    levelId: this.currentLevel,
    rank: this.calculateRank(),
    accuracy: this.averageAccuracy,
    spellUsage: this.spellStats,
  });
}

// In React GamePage
const gameEngineCallbacks = {
  onLevelComplete: (stats) => {
    navigate('/stats', { state: { stats } });
  },
};
```

**React triggers game state changes:**
```jsx
const handlePauseClick = () => {
  gameEngineRef.current.pause();
  setMenuOpen(true);
};

const handleResumeClick = () => {
  gameEngineRef.current.resume();
  setMenuOpen(false);
};
```

### Pattern 4: Gesture Recognition with Web Worker

**Main Thread (GameEngine):**
```javascript
// In InputSystem.js
class InputSystem {
  constructor(canvas) {
    this.worker = new Worker('/gesture-worker.js');
    this.currentPath = [];
    this.isDrawing = false;

    this.worker.onmessage = (e) => {
      if (e.data.type === 'recognized') {
        this.onGestureRecognized(e.data.shape, e.data.confidence);
      }
    };

    canvas.addEventListener('mousedown', this.onPointerDown);
    canvas.addEventListener('mousemove', this.onPointerMove);
    canvas.addEventListener('mouseup', this.onPointerUp);
  }

  onPointerDown = (e) => {
    this.isDrawing = true;
    this.currentPath = [{ x: e.clientX, y: e.clientY, t: Date.now() }];
  };

  onPointerMove = (e) => {
    if (!this.isDrawing) return;
    this.currentPath.push({ x: e.clientX, y: e.clientY, t: Date.now() });

    // Send to worker after certain path length
    if (this.currentPath.length > 10) {
      this.worker.postMessage({ type: 'recognize', path: this.currentPath });
    }
  };

  onPointerUp = (e) => {
    this.isDrawing = false;
    // Final recognition
    this.worker.postMessage({ type: 'recognize', path: this.currentPath });
  };

  onGestureRecognized(shape, confidence) {
    // Continue capturing for trajectory
    this.recognizedShape = shape;
    this.recognizedConfidence = confidence;

    // Trigger spell cast with current path as trajectory
    gameEngine.spellManager.castSpell(shape, this.currentPath, confidence);
  }
}
```

**Web Worker (gesture-worker.js):**
```javascript
// Import $1 Recognizer library
importScripts('/lib/dollar-recognizer.js');

const recognizer = new DollarRecognizer();

self.onmessage = (e) => {
  if (e.data.type === 'recognize') {
    const path = e.data.path;
    const result = recognizer.Recognize(path); // { Name: 'circle', Score: 0.92 }

    self.postMessage({
      type: 'recognized',
      shape: result.Name,
      confidence: result.Score,
    });
  }
};
```

## File Structure

Recommended folder organization for hackathon pace (pragmatic, not over-engineered):

```
aethos/
├── public/
│   ├── index.html
│   ├── gesture-worker.js           # Web Worker for shape recognition
│   └── lib/
│       ├── dollar-recognizer.js    # $1 Recognizer library
│       └── tensorflow.min.js       # TensorFlow.js (if time permits)
│
├── src/
│   ├── index.js                    # Entry point
│   ├── App.jsx                     # Router setup
│   │
│   ├── components/                 # React UI components
│   │   ├── layout/
│   │   │   ├── CustomCursor.jsx   # Existing cursor component
│   │   │   ├── ParticleCanvas.jsx # Existing background particles
│   │   │   └── MenuLink.jsx       # Existing menu link component
│   │   │
│   │   ├── hud/
│   │   │   ├── GameHUD.jsx        # HP, mana, spell bars
│   │   │   ├── AccuracyFeedback.jsx
│   │   │   ├── TutorialOverlay.jsx
│   │   │   └── PauseMenu.jsx
│   │   │
│   │   └── screens/
│   │       ├── StatsScreen.jsx    # Post-level stats
│   │       ├── LoadoutScreen.jsx  # Pre-level spell selection
│   │       ├── UpgradeScreen.jsx  # Between-level upgrades
│   │       └── SettingsScreen.jsx
│   │
│   ├── pages/                      # Route pages
│   │   ├── HomePage.jsx            # Existing main menu
│   │   ├── GamePage.jsx            # Game canvas + HUD container
│   │   ├── ArchivesPage.jsx
│   │   └── SigilsPage.jsx
│   │
│   ├── game/                       # Canvas game engine (NOT React)
│   │   ├── GameEngine.js           # Main orchestrator, game loop
│   │   ├── config.js               # Constants, balance numbers
│   │   │
│   │   ├── systems/
│   │   │   ├── InputSystem.js     # Mouse/touch capture, worker communication
│   │   │   ├── EntityManager.js   # Entity lifecycle
│   │   │   ├── PhysicsSystem.js   # Movement, velocity
│   │   │   ├── CollisionSystem.js # AABB/circle collision detection
│   │   │   ├── RenderPipeline.js  # Canvas drawing
│   │   │   ├── ParticleSystem.js  # Particle pooling, effects
│   │   │   ├── SpellManager.js    # Spell casting, cooldowns
│   │   │   ├── EnemyManager.js    # Spawning, AI
│   │   │   ├── ManaSystem.js      # Mana tracking, regen
│   │   │   ├── LevelManager.js    # Level loading, objectives
│   │   │   └── UpgradeManager.js  # Upgrade application, persistence
│   │   │
│   │   ├── entities/
│   │   │   ├── Player.js          # Player entity (if needed as class)
│   │   │   ├── Projectile.js
│   │   │   ├── Enemy.js
│   │   │   ├── Particle.js
│   │   │   └── Hazard.js
│   │   │
│   │   ├── data/
│   │   │   ├── spells.js          # Spell definitions
│   │   │   ├── enemies.js         # Enemy type definitions
│   │   │   ├── levels.js          # Level configurations
│   │   │   └── upgrades.js        # Upgrade tree definitions
│   │   │
│   │   └── utils/
│   │       ├── math.js            # Vector math, distance, clamp
│   │       ├── collision.js       # Collision detection helpers
│   │       └── quadtree.js        # Spatial partitioning (if needed)
│   │
│   ├── context/                    # React Context providers
│   │   ├── SettingsContext.jsx    # Difficulty, accessibility, colorblind
│   │   └── ProgressContext.jsx    # Unlocked levels, coins, upgrades
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useGameEngine.js       # Encapsulate engine lifecycle
│   │   └── useLocalStorage.js     # Persist save data
│   │
│   └── styles/
│       ├── index.css              # Tailwind imports, global styles
│       └── fonts.css              # Google Fonts (Cinzel, Cormorant)
│
├── .planning/                      # Project planning (existing)
│   ├── PROJECT.md
│   ├── config.json
│   └── research/
│       └── ARCHITECTURE.md        # This file
│
├── package.json
├── tailwind.config.js
└── vite.config.js                 # Or webpack.config.js
```

**Rationale:**
- **Separation by concern:** `/components` (React UI), `/game` (Canvas engine), `/pages` (routes)
- **Flat hierarchy:** Avoid deep nesting for hackathon speed (easy to find files)
- **Data-driven:** Spell/enemy/level definitions in `/data` files, easy to tweak balance
- **Modular systems:** Each system is a standalone class/module, testable in isolation
- **Existing code preserved:** `CustomCursor`, `ParticleCanvas`, `MenuLink` moved to `/components/layout`

## Build Order

**Phase 1: Foundation (Core Loop)**
1. **Set up project structure** (Vite + React + Tailwind, existing menu already works)
2. **Create GameEngine skeleton** with fixed timestep loop (empty update/render)
3. **InputSystem** — Capture mouse events, draw trail on canvas
4. **Integrate $1 Recognizer** — Web Worker for shape recognition, test with console logs
5. **EntityManager + basic rendering** — Spawn dummy entities, render circles on canvas

**Dependencies:** Must have game loop + input + rendering before spells work

---

**Phase 2: Core Gameplay (Spell Casting)**
6. **SpellManager** — Define 3 free spells (Quick Shot, Magic Missile, Fireball)
7. **Projectile entities** — Spawn on spell cast, move in trajectory direction
8. **PhysicsSystem** — Update entity positions based on velocity
9. **ManaSystem** — Track mana, passive regen, HUD display

**Dependencies:** Requires Phase 1 (input, entities, rendering)

---

**Phase 3: Combat (Enemies + Collision)**
10. **EnemyManager** — Spawn slimes with chase behavior
11. **CollisionSystem** — Detect projectile-enemy collisions, deal damage
12. **Enemy death** — Remove entity, drop mana, spawn particles
13. **Player HP** — Take damage from enemy contact, game over on death

**Dependencies:** Requires Phase 2 (projectiles, mana)

---

**Phase 4: Levels (Progression)**
14. **LevelManager** — Load level data, spawn waves, check objectives
15. **Tutorial overlays** — React component for on-screen warnings (Levels 1-15)
16. **Stats screen** — Post-level rank, accuracy, spell usage breakdown
17. **Loadout screen** — Pre-level utility spell selection (mock 2 utilities for now)

**Dependencies:** Requires Phase 3 (enemies, combat)

---

**Phase 5: Depth (Utilities + Hazards)**
18. **Utility spells** — Shield, Life Drain, Time Slow, Dash (4 spells)
19. **Environmental hazards** — Lava, poison clouds, static damage zones
20. **Enemy types** — Turrets (ranged), Fast Zombies, Boss with patterns
21. **Ultimate spell** — Meteor Storm (100 mana AoE)

**Dependencies:** Requires Phase 4 (levels, objectives)

---

**Phase 6: Progression Systems**
22. **UpgradeSystem** — Apply upgrades, persist to localStorage
23. **Endless mode** — Infinite waves, scaling difficulty
24. **Settings screen** — Difficulty, colorblind mode, accessibility
25. **Archives/Sigils screens** — Lore, unlockables (if time permits)

**Dependencies:** Requires Phase 5 (full spell set, enemy variety)

---

**Phase 7: Polish (Juice)**
26. **Particle effects** — Hit particles, spell trails, explosions
27. **Screen shake** — On hits, spell casts, boss attacks
28. **Accuracy feedback** — Visual "Perfect!" / "Good" / "Sloppy" on cast
29. **Sound effects** (if time) — Spell casts, hits, explosions
30. **Visual polish** — Smooth transitions, loading screens, animations

**Dependencies:** Requires Phase 6 (all systems functional)

---

**Critical Path for MVP Demo:**
- Phases 1-3 = Playable core loop (cast spells → hit enemies → gain mana → repeat)
- Phase 4 = Level structure (demo Level 1 tutorial)
- Phase 5 = Variety (show off multiple spells and enemy types)

**If Time-Constrained:**
- Skip Phase 6 (upgrades, endless) — focus on 5 levels with good variety
- Skip Phase 7 polish (except screen shake, very high ROI for hackathon wow-factor)

**Build Order Implications:**
- **Start with Canvas first, React later** — Game loop must work before HUD
- **Test each system in isolation** — Spawn test enemies before implementing AI
- **Data-driven from start** — Define spell/enemy configs in JSON-like files, tweak without code changes
- **Defer optimization** — Build features first, profile and optimize only if performance issues arise

## Sources

**React + Canvas Game Architecture:**
- [How to Use React.js to Build Interactive Games - DEV Community](https://dev.to/srdan_borovi_584c6b1d773/how-to-use-reactjs-to-build-interactive-games-537j)
- [Game of Life as a React Component using Canvas - DEV Community](https://dev.to/vetswhocode/game-of-life-as-a-react-component-using-canvas-275g)
- [React State Management in 2025: What You Actually Need](https://www.developerway.com/posts/react-state-management-2025)
- [Why Your React App Lags but This Canvas Game Runs at 60FPS - DEV Community](https://dev.to/yzbkaka_dev/why-your-react-app-lags-but-this-canvas-game-runs-at-60fps-2h1d)

**Game Loop Patterns:**
- [Create a Proper Game Loop - JavaScript Tutorial | Spicy Yoghurt](https://spicyyoghurt.com/tutorials/html5-javascript-game-development/create-a-proper-game-loop-with-requestanimationframe)
- [A Detailed Explanation of JavaScript Game Loops and Timing | Isaac Sukin](https://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing)
- [Performant Game Loops in JavaScript | Aleksandr Hovhannisyan](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/)
- [Window: requestAnimationFrame() method - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)

**Component-Based Game Architecture:**
- [Component · Decoupling Patterns · Game Programming Patterns](https://gameprogrammingpatterns.com/component.html)
- [Introduction to Component Based Architecture in Games | Kodeco](https://www.kodeco.com/2806-introduction-to-component-based-architecture-in-games)
- [Entity component system - Wikipedia](https://en.wikipedia.org/wiki/Entity_component_system)

**Gesture Recognition Systems:**
- [GitHub - GreenHacker420/gesture-canvas: Gesture Canvas Art Stream](https://github.com/GreenHacker420/gesture-canvas)
- [Adding Mouse and Touch Controls to Canvas - Apple Developer](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/HTML-canvas-guide/AddingMouseandTouchControlstoCanvas/AddingMouseandTouchControlstoCanvas.html)

**Spell System Architecture:**
- [Architecture for a spell system - Unity Discussions](https://discussions.unity.com/t/architecture-for-a-spell-system/917303)
- [How To Create A Simple Spell System In Unity - C# and Unity development](https://giannisakritidis.com/blog/Simple-Spell-System/)

**Hackathon Development:**
- [Hackathon Raptors - Building GameForge AI](https://www.raptors.dev/blog/building-gameforge-ai-a-technical-deep-dive)
- [Mastering Rapid Prototyping Tools: Your Key to Hackathon Success | Medium](https://medium.com/@ftieben/mastering-rapid-prototyping-tools-your-key-to-hackathon-success-26ffe5659fd4)

**React Project Structure:**
- [React Folder Structure in 5 Steps [2025]](https://www.robinwieruch.de/react-folder-structure/)
- [Recommended Folder Structure for React 2025 - DEV Community](https://dev.to/pramod_boda/recommended-folder-structure-for-react-2025-48mc)
