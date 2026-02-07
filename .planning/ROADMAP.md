# Roadmap: AETHOS -- Fragments of the Void

## Overview

AETHOS is built in 7 phases following its linear dependency chain: Canvas infrastructure first, then gesture input, then spells, then something to cast spells at, then resource depth, then structured levels, then polish. Each phase delivers a demoable vertical slice. Phases 1-4 produce the playable core loop (draw gesture, spell fires, enemy dies). Phases 5-7 add strategic depth, structure, and the "juice" that wins hackathon demos. The entire roadmap is scoped for a solo 24-48 hour hackathon with Claude as the builder.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Canvas rendering, game loop, input capture, Zustand bridge
- [x] **Phase 2: Gesture Recognition** - $1 Recognizer integration, shape detection, drawing feedback
- [ ] **Phase 3: Spell Casting** - Free spells, projectile trajectories, accuracy scaling
- [ ] **Phase 4: Combat System** - Enemies, collision detection, damage, wave spawning
- [ ] **Phase 5: Mana and Spell Depth** - 3-tier mana system, utility spells, ultimate, loadouts
- [ ] **Phase 6: Levels and Progression** - Tutorial levels, level structure, upgrades, UI screens
- [ ] **Phase 7: Polish and VFX** - Particle system, screen shake, impact effects, visual juice

## Phase Details

### Phase 1: Foundation
**Goal**: Player sees a Canvas game screen with a visible drawing trail that responds to mouse/touch input at 60 FPS, integrated with the existing React menu
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, UIHD-01, UIHD-09
**Research**: Standard patterns -- skip research spike
**Pitfalls to avoid**: Delta time from day one (Pitfall 1), Canvas isolated from React state via useRef (Pitfall 2), requestAnimationFrame cleanup on unmount (Pitfall 10)
**Fallback**: If behind, stub the entity manager and ship with just game loop + input trail
**Success Criteria** (what must be TRUE):
  1. Navigating from the existing main menu launches a Canvas game screen that renders at 60 FPS
  2. Drawing with mouse/touch on the Canvas produces a visible trail in real time with no perceptible lag
  3. Navigating away from the game screen and back does not leak animation frames or crash the browser
  4. The game screen matches the existing dark mystical aesthetic (teal/gold/navy palette, Cinzel Decorative font)
  5. Game objects (test circles/entities) move smoothly at the same speed regardless of display refresh rate (60Hz vs 120Hz)
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Vite project scaffold, React Router, existing menu, Canvas game loop with fixed timestep, Zustand store
- [x] 01-02-PLAN.md -- Mouse/touch input system with drawing trail, entity management with test entities

### Phase 2: Gesture Recognition
**Goal**: Player draws shapes on Canvas and the game reliably recognizes them, providing immediate visual feedback on what shape was detected and how accurately it was drawn
**Depends on**: Phase 1 (Canvas rendering, input capture)
**Requirements**: GEST-01, GEST-02, GEST-03, GEST-04, GEST-05, GEST-06, VFXP-07, ACCS-04
**Research**: Needs 1-2 hour research spike on $1 Recognizer API, gesture template tuning, and recognition threshold calibration
**Pitfalls to avoid**: Too strict shape matching kills playability (Pitfall 6), must test on trackpad AND mouse (Pitfall 3), keyboard shortcuts as emergency fallback (Pitfall 3)
**Fallback**: If $1 Recognizer struggles with all 8 shapes, ship with 3 core shapes (circle, triangle, line) and map remaining spells to keyboard
**Success Criteria** (what must be TRUE):
  1. Player draws a circle, triangle, or line and the game correctly identifies the shape at least 80% of the time across mouse and trackpad input
  2. Drawing trail has a visible glow effect and changes color when a shape is recognized
  3. The recognized shape name and accuracy score are displayed on screen immediately after recognition
  4. Player can continue drawing after shape recognition to define a trajectory direction
  5. Keyboard shortcuts (Q, W, E) work as emergency fallback for casting spells without gestures
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md -- $1 Recognizer integration, gesture templates (8 shapes x 3 variations), recognition wiring into GameEngine
- [x] 02-02-PLAN.md -- Visual feedback (trail color change, shape name display), trajectory extraction, keyboard shortcuts (Q/W/E)

### Phase 3: Spell Casting
**Goal**: Recognized gestures fire visible spell projectiles that follow the player's drawn trajectory, with accuracy from gesture quality affecting spell power
**Depends on**: Phase 2 (gesture recognition, trajectory extraction)
**Requirements**: SPEL-01, SPEL-02, SPEL-03, SPEL-04, SPEL-10, SPEL-12, UIHD-05, VFXP-08
**Research**: Optional 1-hour spike on bezier curve trajectories (straight lines are the fallback and still novel)
**Pitfalls to avoid**: Input latency kills game feel -- spell must appear within 1-2 frames of recognition (Pitfall 7)
**Fallback**: If trajectory aiming is too complex, ship with directional aiming (spell fires in the direction of the last drawn segment)
**Success Criteria** (what must be TRUE):
  1. Drawing a circle spawns a Quick Shot projectile that travels along the drawn trajectory path
  2. Drawing a triangle spawns Magic Missile projectiles that home toward the nearest target area
  3. Drawing a zigzag spawns a Fireball projectile with an AoE explosion visual at impact point
  4. Sloppy gesture draws produce visibly weaker spells (reduced size/brightness) with accuracy feedback text ("Perfect!", "Good", "Sloppy")
  5. Spells are color-coded by tier (blue/cyan for free spells) and visually distinct from each other
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md -- Spell config, projectile entities (QuickShot/MagicMissile/Fireball), object pooling, SpellCaster system, GameEngine wiring
- [ ] 03-02-PLAN.md -- Accuracy-based visual scaling, Fireball AoE explosion, GestureUI spell names, visual verification checkpoint

### Phase 4: Combat System
**Goal**: Spells hit enemies, enemies take damage and die, enemies fight back with contact damage, and the core gameplay loop (draw, cast, kill, survive) is playable end-to-end
**Depends on**: Phase 3 (spell projectiles exist and move)
**Requirements**: COMB-01, COMB-02, COMB-03, COMB-04, COMB-05, COMB-06, COMB-07, COMB-08, COMB-09, COMB-10, UIHD-02
**Research**: Standard patterns -- chase AI and AABB collision are textbook
**Pitfalls to avoid**: Balance values must come from research reference numbers, not guesses (Pitfall 17); object pooling for enemy death particles from the start (Pitfall 4)
**Fallback**: If behind, ship with 1 enemy type (Slime) and defer Turret/Zombie/Boss/Hazards to Phase 5 or cut entirely
**Success Criteria** (what must be TRUE):
  1. Slime enemies spawn at screen edges, chase the player, and can be killed by spell projectiles
  2. Enemies display health bars and flash white when taking damage
  3. The player has an HP bar on the HUD and takes contact damage when enemies reach them
  4. Dead enemies disappear with a visual death effect
  5. Waves of enemies spawn in configurable compositions with increasing challenge
**Plans**: TBD

Plans:
- [ ] 04-01: Enemy entities and collision system
- [ ] 04-02: Wave spawning and additional enemy types

### Phase 5: Mana and Spell Depth
**Goal**: Player manages a mana resource with visible thresholds, enabling strategic choices between free spam, utility spells at 35 mana, and a devastating ultimate at 100 mana
**Depends on**: Phase 4 (enemies exist to drop mana, combat loop works)
**Requirements**: SPEL-05, SPEL-06, SPEL-07, SPEL-08, SPEL-09, SPEL-11, MANA-01, MANA-02, MANA-03, MANA-04, MANA-05, UIHD-03, UIHD-04
**Research**: Straightforward state management -- skip research spike
**Pitfalls to avoid**: Invisible game state -- mana thresholds MUST have clear visual indicators (Pitfall 16)
**Fallback**: If behind, ship with mana bar + 1 utility spell (Shield) and defer remaining utility spells and ultimate
**Success Criteria** (what must be TRUE):
  1. Mana bar on HUD shows current mana with color-coded tiers (blue below 35, purple glow at 35+, gold pulse at 100)
  2. Mana regenerates passively and increases when enemies are killed
  3. Drawing a swipe at 35+ mana casts Shield that blocks incoming damage; drawing a spiral casts Life Drain that heals on hit
  4. Drawing a star pattern at 100 mana triggers Meteor Storm ultimate with massive AoE visual
  5. Player can select 2 utility spells before each level from the available loadout
**Plans**: TBD

Plans:
- [ ] 05-01: Mana system and HUD indicators
- [ ] 05-02: Utility spells, ultimate spell, and loadout selection

### Phase 6: Levels and Progression
**Goal**: The game has structured tutorial levels that teach mechanics one at a time, a progression system between levels, and supporting UI screens (stats, archives, sigils, settings)
**Depends on**: Phase 5 (full spell set and mana system for tutorial content)
**Requirements**: LEVL-01, LEVL-02, LEVL-03, LEVL-04, LEVL-05, LEVL-06, LEVL-07, LEVL-08, LEVL-09, LEVL-10, UIHD-06, UIHD-07, UIHD-08, ACCS-01, ACCS-02, ACCS-03
**Research**: Standard level state machine and tutorial overlay pattern -- skip research spike
**Pitfalls to avoid**: Scope creep on level count -- 3-5 polished tutorial levels beats 20 broken ones (Pitfall 12)
**Fallback**: If behind, ship 3 tutorial levels + win/loss screens only; defer upgrades, endless mode, accessibility options, and secondary UI screens
**Success Criteria** (what must be TRUE):
  1. Level 1 teaches circle gesture with on-screen prompts and spawns 1 slime to kill
  2. Level 2 teaches triangle gesture with trajectory aiming and spawns 2 slimes
  3. Level 3 introduces multiple spells and spawns 3+ enemies
  4. Completing a level shows a stats screen with accuracy rank and spell usage breakdown
  5. Player can restart on death, and win/loss conditions are clear and immediate
**Plans**: TBD

Plans:
- [ ] 06-01: Level manager and tutorial levels
- [ ] 06-02: Progression systems and UI screens

### Phase 7: Polish and VFX
**Goal**: Every action in the game feels powerful and responsive through particle effects, screen shake, and visual juice -- transforming working mechanics into a memorable hackathon demo
**Depends on**: Phase 6 (all game systems functional, levels playable)
**Requirements**: VFXP-01, VFXP-02, VFXP-03, VFXP-04, VFXP-05, VFXP-06
**Research**: Particle tutorials are abundant -- skip research spike
**Pitfalls to avoid**: Particle memory leak via object pooling with hard cap of 200-300 particles (Pitfall 4); must profile FPS with max enemies + particles active (Pitfall 5)
**Fallback**: If behind, add screen shake only (highest ROI, 30 minutes) and skip particle system entirely
**Success Criteria** (what must be TRUE):
  1. Casting a spell produces a particle burst at the origin point
  2. Spell projectiles leave visible particle trails as they travel
  3. Hitting an enemy produces impact explosion particles
  4. Big spells and ultimates trigger screen shake (3px normal, 5px ultimate)
  5. Game maintains 60 FPS with particle effects active during combat with 5+ enemies
**Plans**: TBD

Plans:
- [ ] 07-01: Particle system with object pooling
- [ ] 07-02: Screen shake, impact effects, and performance tuning

## Critical Path

**MVP Demo (Phases 1-4):** Draw gesture -> spell fires -> enemy dies -> next wave. This is playable and demoable.

**Strategic Depth (Phase 5):** 3-tier mana adds the "wow, that's clever" differentiator for judges.

**Demo Structure (Phase 6):** Tutorial levels let judges experience the game without instructions.

**Demo Quality (Phase 7):** Polish is what makes hackathon demos memorable. Budget minimum 2 hours.

**Time-constrained fallbacks:**
- Behind by Hour 16: Cut Phase 5 to mana bar + 1 utility spell only
- Behind by Hour 20: Cut Phase 6 to 3 levels + restart button, no upgrades or secondary screens
- Behind by Hour 22: Cut Phase 7 to screen shake only (30 min implementation)
- Emergency: Phases 1-4 alone are a demoable game

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-02-06 |
| 2. Gesture Recognition | 2/2 | Complete | 2026-02-07 |
| 3. Spell Casting | 0/2 | Not started | - |
| 4. Combat System | 0/2 | Not started | - |
| 5. Mana and Spell Depth | 0/2 | Not started | - |
| 6. Levels and Progression | 0/2 | Not started | - |
| 7. Polish and VFX | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-06*
*Depth: standard (7 phases)*
*Coverage: 71/71 v1 requirements mapped*
