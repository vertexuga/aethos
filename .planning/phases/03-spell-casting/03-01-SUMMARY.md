---
phase: 03-spell-casting
plan: 01
subsystem: gameplay
tags: [projectiles, spells, object-pooling, canvas-rendering, gesture-integration]

# Dependency graph
requires:
  - phase: 02-gesture-recognition
    provides: Gesture recognition system with trajectory extraction and keyboard fallback
provides:
  - Three spell projectile types (QuickShot, MagicMissile, Fireball)
  - Object pooling system for GC-free projectile management
  - SpellCaster system mapping gestures to projectile spawning
  - Centralized spell configuration data
affects: [04-combat-mechanics, 05-mana-system]

# Tech tracking
tech-stack:
  added: []
  patterns: [object-pooling, additive-blend-rendering, entity-lifetime-management]

key-files:
  created:
    - src/game/data/spellConfig.js
    - src/game/systems/ProjectilePool.js
    - src/game/systems/SpellCaster.js
    - src/game/entities/projectiles/QuickShotEntity.js
    - src/game/entities/projectiles/MagicMissileEntity.js
    - src/game/entities/projectiles/FireballEntity.js
  modified:
    - src/game/engine/GameEngine.js
    - src/game/systems/KeyboardFallback.js

key-decisions:
  - "Object pooling with pre-allocated entities (30 QuickShot, 30 MagicMissile, 20 Fireball) to prevent GC pauses"
  - "Additive blend rendering (globalCompositeOperation = 'lighter') for projectile glow effect"
  - "Projectiles destroy when leaving canvas bounds instead of wrapping (unlike other entities)"
  - "Keyboard spells spawn at screen center with rightward default trajectory"

patterns-established:
  - "Projectile lifecycle: Pool management with reset() method for property reuse, age-based auto-destruction"
  - "Spell configuration: Centralized SPELL_CONFIG object for easy balancing (speed, size, color, damage, lifetime)"
  - "Rendering optimization: Shadow blur and additive blending for visual polish without performance hit"

# Metrics
duration: 3min
completed: 2026-02-07
---

# Phase 3 Plan 01: Spell Casting Infrastructure Summary

**Three visually distinct spell projectiles (cyan QuickShot, light-cyan elongated MagicMissile, orange Fireball with inner glow) spawned via gestures with object-pooled, additive-blend rendering**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-07T01:17:22Z
- **Completed:** 2026-02-07T01:20:22Z
- **Tasks:** 2
- **Files created:** 6
- **Files modified:** 2

## Accomplishments
- Object pooling system eliminates GC pauses for projectile spawning (pools of 30/30/20 entities)
- Three spell types with distinct visual styles: cyan glow (QuickShot), elongated light-cyan (MagicMissile), orange with yellow core (Fireball)
- SpellCaster system bridges gesture recognition to projectile spawning in same frame (no perceptible delay)
- Projectiles auto-destroy after lifetime (3-4 seconds) and when leaving canvas bounds
- Keyboard shortcuts Q/W/E spawn spells at screen center with rightward trajectory

## Task Commits

Each task was committed atomically:

1. **Task 1: Create spell config, projectile entities, and object pool** - `6a2dc26` (feat)
2. **Task 2: Create SpellCaster system and wire into GameEngine** - `31e8d80` (feat)

## Files Created/Modified

**Created:**
- `src/game/data/spellConfig.js` - Centralized spell stats (speed, size, color, damage, lifetime) for all 3 spell types
- `src/game/systems/ProjectilePool.js` - Object pooling for projectile reuse, pre-allocates entities and manages active/inactive state
- `src/game/entities/projectiles/QuickShotEntity.js` - Circle gesture → fast cyan projectile with additive glow (400 px/sec, 3s lifetime)
- `src/game/entities/projectiles/MagicMissileEntity.js` - Triangle gesture → elongated light-cyan projectile (250 px/sec, 4s lifetime)
- `src/game/entities/projectiles/FireballEntity.js` - Zigzag gesture → orange projectile with yellow inner glow (300 px/sec, 3s lifetime)
- `src/game/systems/SpellCaster.js` - Maps gesture results to projectile spawning, manages three pools, calculates velocity from trajectory

**Modified:**
- `src/game/engine/GameEngine.js` - Integrated SpellCaster system, removed test entity spawning, added projectile boundary destruction
- `src/game/systems/KeyboardFallback.js` - Changed E key mapping from 'line' to 'zigzag' for Fireball spell

## Decisions Made

**Object Pool Sizing:**
- QuickShot: 30 entities (fastest fire rate expected)
- MagicMissile: 30 entities (medium fire rate)
- Fireball: 20 entities (slower, higher damage spell)
- Pool sizes chosen for hackathon scope; can be increased if exhaustion warnings appear

**Rendering Approach:**
- Additive blending (`globalCompositeOperation = 'lighter'`) for glow effect without alpha compositing overhead
- Shadow blur values: 8px (QuickShot/MagicMissile), 12px (Fireball) for visual hierarchy
- MagicMissile uses ellipse with 1.5x width, 0.6x height for elongated appearance
- Fireball uses two concentric circles (outer orange, inner yellow at 60% alpha)

**Boundary Behavior:**
- Projectiles destroy when leaving canvas (prevents infinite accumulation)
- Non-projectile entities continue to wrap (preserves existing behavior)
- Boundary check in GameEngine.update() distinguishes by `entity.type.startsWith('projectile-')`

**Keyboard Spell Trajectory:**
- Default rightward direction `{ x: 1, y: 0 }` from screen center
- SpellCaster.setCanvasSize() called on init and resize for accurate center calculation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all imports resolved correctly, build passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 4 (Combat Mechanics):**
- Spell projectiles spawning and moving correctly
- Projectile entities have `getDamage()` method ready for collision damage calculation
- MagicMissile stores `this.speed` property for future homing behavior
- Fireball has `explosionRadius` property ready for AoE implementation

**No blockers.** Spell casting infrastructure complete and functional.

---
*Phase: 03-spell-casting*
*Completed: 2026-02-07*
