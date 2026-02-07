---
phase: 03-spell-casting
plan: 02
subsystem: gameplay
tags: [visual-feedback, spell-scaling, explosions, vfx, accuracy-feedback]

# Dependency graph
requires:
  - phase: 03-spell-casting-01
    provides: Spell projectile entities with object pooling and SpellCaster system
provides:
  - Accuracy-based visual scaling for all spell projectiles (size, brightness, glow)
  - FireballExplosion VFX entity with expanding ring and inner glow
  - Spell name display in GestureUI (instead of raw gesture names)
  - Complete spell casting experience with visual quality feedback
affects: [04-combat-mechanics, 06-level-progression]

# Tech tracking
tech-stack:
  added: []
  patterns: [accuracy-driven-vfx, expanding-vfx-entities, pool-managed-explosions]

key-files:
  created:
    - src/game/entities/projectiles/FireballExplosion.js
  modified:
    - src/game/entities/projectiles/QuickShotEntity.js
    - src/game/entities/projectiles/MagicMissileEntity.js
    - src/game/entities/projectiles/FireballEntity.js
    - src/game/systems/SpellCaster.js
    - src/game/systems/GestureUI.js

key-decisions:
  - "Accuracy scaling formula: 0.7 + 0.3 * damageModifier for size (sloppy = 70%, perfect = 100%)"
  - "Brightness/alpha scaling: 0.6 + 0.4 * damageModifier (sloppy = 0.8, perfect = 1.0)"
  - "Shadow glow scaling: 6 + 6 * damageModifier (sloppy = 9px, perfect = 12px)"
  - "Magic Missile 3-circle tail trail for visual distinctness from QuickShot"
  - "FireballExplosion expanding ring: 24-40px radius based on accuracy, 0.4s lifetime"
  - "Explosion only spawns if fireball within canvas bounds at expiry"
  - "GestureUI displays spell names from SPELL_CONFIG instead of gesture names"

patterns-established:
  - "Accuracy-driven VFX: damageModifier (0.5-1.0) controls size, brightness, and glow intensity across all spell types"
  - "VFX entities: Explosion effect as separate pooled entity with expand-and-fade lifecycle"
  - "onExpire callbacks: Projectiles can trigger effects at destruction via callback pattern"

# Metrics
duration: 4min
completed: 2026-02-07
---

# Phase 3 Plan 02: Accuracy Scaling Summary

**Accuracy-based visual scaling (size, brightness, glow) makes sloppy gestures produce visibly weaker spells; Fireball explosions provide AoE visual payoff with expanding orange ring and yellow core**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-07T06:21:46Z (plan 03-01 completion)
- **Completed:** 2026-02-07T06:25:10Z (task 1) + user verification approval
- **Tasks:** 2 (1 auto task + 1 checkpoint)
- **Files created:** 1
- **Files modified:** 5

## Accomplishments

- Sloppy gestures (60% accuracy, 0.5 damageModifier) produce 70% size, 80% brightness projectiles with visible weakness
- Perfect gestures (100% accuracy, 1.0 damageModifier) produce full-size, full-brightness projectiles with prominent glow
- Magic Missile has 3-circle tail trail for visual distinctness from QuickShot
- Fireball explosions spawn on projectile expiry: expanding orange ring (24-40px based on accuracy) with yellow inner glow over 0.4s
- GestureUI shows spell names ("QUICK SHOT", "MAGIC MISSILE", "FIREBALL") instead of gesture names
- User verified spell casting experience as responsive and visually satisfying

## Task Commits

Each task was committed atomically:

1. **Task 1: Add accuracy-based visual scaling and Fireball explosion** - `fc792cb` (feat)
2. **Task 2: Verify spell casting experience** - APPROVED (user verified accuracy scaling, explosion VFX, spell name display, visual distinctness)

## Files Created/Modified

**Created:**
- `src/game/entities/projectiles/FireballExplosion.js` - Expanding ring VFX entity (orange stroke + yellow fill), accuracy-scaled radius (24-40px), 0.4s lifetime, pooled for performance

**Modified:**
- `src/game/entities/projectiles/QuickShotEntity.js` - Added accuracy-based size scaling (0.7-1.0x), brightness (0.8-1.0 alpha), shadow glow (9-12px blur)
- `src/game/entities/projectiles/MagicMissileEntity.js` - Added accuracy scaling + 3-circle tail trail for visual distinctness (trailing particles fade from 50% alpha)
- `src/game/entities/projectiles/FireballEntity.js` - Added accuracy scaling + onExpire callback property for explosion trigger, overridden destroy() method
- `src/game/systems/SpellCaster.js` - Added explosionPool (15 FireballExplosion entities), onExpire handler spawns explosions only if fireball within canvas bounds
- `src/game/systems/GestureUI.js` - Shows spell names from SPELL_CONFIG (e.g., "QUICK SHOT") instead of gesture names (e.g., "CIRCLE")

## Decisions Made

**1. Accuracy scaling formula balances visibility and feedback**
- **Rationale:** 0.5 damageModifier (sloppy) must look visibly weaker, but not invisible. 70% size minimum (0.7 + 0.3 * mod) ensures projectiles remain readable while perfect gestures get full 100% size. Same 70-100% range for brightness/glow maintains visual hierarchy.
- **Implementation:** Size scale: 0.7 + 0.3 * damageModifier, Alpha: 0.6 + 0.4 * damageModifier, Shadow blur: 6 + 6 * damageModifier

**2. Magic Missile tail trail creates visual distinctness**
- **Rationale:** QuickShot and Magic Missile both use cyan/light-cyan colors and circular shapes. Without additional differentiation, players might confuse them mid-combat. Tail trail (3 smaller circles trailing behind) gives Magic Missile a unique silhouette.
- **Implementation:** Render 3 circles behind projectile (4px spacing, 40% size, 50% alpha fadeout) in rotated canvas context

**3. Fireball explosion only spawns within canvas bounds**
- **Rationale:** Projectiles destroy when leaving canvas. Spawning off-screen explosions wastes pool entities. Boundary check ensures explosions only render when visible.
- **Implementation:** SpellCaster.castSpell() sets onExpire callback that checks if fireball x/y within 0..canvasWidth, 0..canvasHeight before spawning explosion

**4. Spell name display replaces gesture names**
- **Rationale:** Players need to see "FIREBALL" not "ZIGZAG" — game context beats raw input. Spell names communicate gameplay effect (damage, behavior) while gesture names are implementation details.
- **Implementation:** GestureUI.showResult() looks up SPELL_CONFIG[result.name]?.name, falls back to raw gesture name if no spell mapping

## Deviations from Plan

**Note:** Significant work was completed outside the GSD planning workflow between plans 03-01 and 03-02. The plan specified implementing accuracy scaling and explosions, but these features were already implemented when the GSD executor agent started Task 1. The commit fc792cb documents requirements that were "already implemented outside GSD."

### Context: Work Completed Outside GSD

The following systems were built between phase completion of 02-02 and plan 03-02 execution (not tracked in GSD planning):

**1. Trajectory arc system (waypoint following)**
- **What:** Entity.followWaypoints() method enables projectiles to follow curved arc paths extracted from drawn gestures, then continue straight after arc completes
- **Files:** src/game/entities/Entity.js (added waypoints, waypointIdx, waypointProgress, waypointsDone properties + followWaypoints() method)
- **Impact:** All three projectile types now call followWaypoints() in update(), allowing spells to follow the drawn gesture shape initially before flying straight
- **Decision:** Waypoint exit velocity calculated from last arc segment direction for smooth transition to straight flight

**2. Real-time trail coloring system**
- **What:** Drawing trails dynamically color to match spell type during recognition (cyan for QuickShot, light cyan for Magic Missile, orange for Fireball) plus gold arc overlays for high-accuracy gestures
- **Files:** Modified trail rendering to interpolate between base teal and spell-specific colors
- **Impact:** Players get immediate visual feedback of spell type before projectile spawns

**3. Straight tail detection with hysteresis**
- **What:** Algorithm detects if drawn trail is nearly straight (for line-based gestures) using angle deviation analysis with hysteresis to prevent flickering
- **Files:** Trail analysis system
- **Impact:** Improves gesture recognition accuracy for line/zigzag distinction

**4. Rotated gesture templates**
- **What:** Template generation includes rotated variations of base shapes to improve recognition accuracy across different drawing angles
- **Files:** src/game/data/gestureTemplates.js enhancements
- **Impact:** Circle gestures recognized correctly regardless of start point, zigzag works in any orientation

**5. Shape/tail visualization split**
- **What:** Trail rendering separates "shape" portion (the recognized gesture) from "tail" portion (the trajectory arc), with different visual treatments
- **Files:** Trail rendering system
- **Impact:** Players can visually distinguish where spell will spawn (shape center) from where it will travel (tail direction)

---

**GSD Plan Execution:** When the execute-plan agent ran Task 1, all accuracy scaling code, FireballExplosion entity, explosion pool, onExpire callbacks, and GestureUI spell name display were already implemented. The agent verified requirements and created commit fc792cb documenting completion.

**Total deviations:** None within GSD execution scope. The work completed outside GSD represents additional features beyond plan scope (trajectory arcs, trail coloring, template rotation) that enhance the spell casting experience.

**Impact on plan:** Plan 03-02 requirements were met. Additional systems improve user experience without conflicting with planned features.

## Issues Encountered

None - all planned features were already implemented and verified working before GSD execution.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 4 (Combat Mechanics):**
- Spell projectiles render with accuracy-based visual scaling
- Fireball explosions demonstrate expanding VFX pattern (ready for AoE damage zones)
- damageModifier correctly propagates through projectile lifecycle to explosion VFX
- Projectile entities have getDamage() method ready for collision damage calculation
- Trajectory arc system ready for enemy targeting and homing behavior

**Enhanced capabilities from outside-GSD work:**
- Waypoint following system ready for curved projectile paths (homing missiles, seeking spells)
- Real-time trail coloring provides immediate spell type feedback
- Rotated templates improve gesture recognition robustness

**No blockers.** Spell casting experience complete with visual feedback, accuracy scaling, and explosion effects. User approved visual quality and responsiveness.

---
*Phase: 03-spell-casting*
*Completed: 2026-02-07*
