# Requirements: AETHOS -- Fragments of the Void

**Defined:** 2026-02-06
**Core Value:** Drawing shapes to cast spells must feel magical -- responsive gesture recognition, visual feedback, and spell effects ARE the experience.

## v1 Requirements

Requirements for hackathon demo. Each maps to roadmap phases. Organized by system with priority tiers (P0 = core loop, P1 = differentiator, P2 = depth, P3 = polish).

### Foundation

- [x] **FOUND-01**: Vite + React 19 project scaffold with Tailwind CSS 4 and React Router (P0)
- [x] **FOUND-02**: HTML5 Canvas rendering layer isolated from React via useRef bridge pattern (P0)
- [x] **FOUND-03**: Fixed timestep game loop (16.67ms updates) with delta time for frame-rate independent physics (P0)
- [x] **FOUND-04**: Input capture system for mouse/touch drawing with visible trail on Canvas (P0)
- [x] **FOUND-05**: Zustand state store bridging Canvas game engine and React UI layer (P0)
- [x] **FOUND-06**: requestAnimationFrame cleanup on component unmount (P0)
- [x] **FOUND-07**: Entity management system for game objects (enemies, projectiles, particles) (P0)

### Gesture Recognition

- [x] **GEST-01**: $1 Recognizer integration for shape detection (circle, triangle, swipe, zigzag, spiral, circle-dot, horizontal swipe hold, star+circles) (P0)
- [x] **GEST-02**: Visual drawing trail with glow effect during gesture input (P0)
- [x] **GEST-03**: Shape recognition feedback -- recognized shape name displayed, trail color change on match (P0)
- [x] **GEST-04**: Accuracy scoring from gesture quality (0.5x to 1.0x damage modifier) (P1)
- [x] **GEST-05**: Generous gesture tolerance (60-70% match threshold) for reliable recognition across input devices (P0)
- [x] **GEST-06**: Trajectory extraction from continued drawing after shape recognition (P1)

### Spell System

- [x] **SPEL-01**: Three-tier spell system -- Free (0 mana), Utility (35 mana), Ultimate (100 mana) (P1)
- [x] **SPEL-02**: Quick Shot spell (circle gesture, 0 mana, fast projectile) (P0)
- [x] **SPEL-03**: Magic Missile spell (triangle gesture, 0 mana, homing projectile) (P0)
- [x] **SPEL-04**: Fireball spell (zigzag gesture, 0 mana, AoE explosion) (P1)
- [ ] **SPEL-05**: Shield spell (swipe gesture, 35 mana, blocks incoming damage) (P2)
- [ ] **SPEL-06**: Life Drain spell (spiral gesture, 35 mana, heals on hit) (P2)
- [ ] **SPEL-07**: Time Slow spell (circle-dot gesture, 35 mana, slows enemies) (P2)
- [ ] **SPEL-08**: Dash spell (horizontal swipe hold, 35 mana, dodge movement) (P2)
- [ ] **SPEL-09**: Meteor Storm ultimate (star+circles gesture, 100 mana, massive AoE) (P1)
- [x] **SPEL-10**: Projectile entities spawned on cast with trajectory from continued drawing (P1)
- [ ] **SPEL-11**: Spell loadout selection -- pick 2 utility spells before each level (P2)
- [x] **SPEL-12**: Accuracy scaling -- sloppy draws deal reduced damage based on gesture quality (P1)

### Combat & Enemies

- [ ] **COMB-01**: One enemy type -- Slime with chase AI toward player, health bar, death animation (P0)
- [ ] **COMB-02**: Collision detection system (circle/AABB) for projectiles hitting enemies (P0)
- [ ] **COMB-03**: Damage application -- enemy health reduction with visual hit feedback (white flash) (P0)
- [ ] **COMB-04**: Player HP system with contact damage from enemies (P0)
- [ ] **COMB-05**: Turret enemy type -- stationary, fires projectiles at player (P2)
- [ ] **COMB-06**: Fast Zombie enemy type -- high speed, low health (P2)
- [ ] **COMB-07**: Boss enemy type -- high HP, attack patterns, telegraphed attacks (P2)
- [ ] **COMB-08**: Environmental hazards -- lava zones, poison clouds, falling debris (P3)
- [ ] **COMB-09**: Enemy visual language with color coding and attack warnings (P1)
- [ ] **COMB-10**: Wave spawning system with configurable enemy composition (P1)

### Mana & Resources

- [ ] **MANA-01**: Mana resource pool (0-100) with visual thresholds at 35 (utility) and 100 (ultimate) (P1)
- [ ] **MANA-02**: Passive mana regeneration (5/sec base rate) (P1)
- [ ] **MANA-03**: Kill bonus mana -- enemies drop mana on death (P1)
- [ ] **MANA-04**: Visual mana bar with color-coded tiers (blue=free, purple glow=utility ready, gold pulse=ultimate ready) (P1)
- [ ] **MANA-05**: HUD indicators when thresholds reached ("Utility Ready", "Ultimate Ready") (P1)

### Levels & Progression

- [ ] **LEVL-01**: Level 1 tutorial -- draw circle to cast Quick Shot, kill 1 slime (P0)
- [ ] **LEVL-02**: Level 2 tutorial -- draw triangle, aim trajectory, kill 2 slimes (P0)
- [ ] **LEVL-03**: Level 3 tutorial -- use multiple spells, kill 3 slimes (P0)
- [ ] **LEVL-04**: 20 structured levels with gradual mechanic introduction (P2)
- [ ] **LEVL-05**: Endless mode unlocked after Level 20 (P3)
- [ ] **LEVL-06**: Win/loss conditions with restart functionality (P0)
- [ ] **LEVL-07**: Upgrade system between levels -- mana capacity, spell efficiency, spell power, ultimate charge (P2)
- [ ] **LEVL-08**: Difficulty scaling (Easy/Normal/Hard affecting mana costs and regen rates) (P3)
- [ ] **LEVL-09**: On-screen tutorial warnings for utility triggers (Levels 1-15, then fade) (P2)
- [ ] **LEVL-10**: Post-level stats screen with rank, accuracy, spell usage breakdown (P2)

### UI & HUD

- [x] **UIHD-01**: Main menu screen (existing design -- Begin Journey, Archives, Sigils, Settings, Depart) (P0)
- [ ] **UIHD-02**: Game HUD with HP bar overlay (P0)
- [ ] **UIHD-03**: Game HUD with mana bar and threshold indicators (P1)
- [ ] **UIHD-04**: Spell bar showing available/equipped spells (P1)
- [x] **UIHD-05**: Accuracy feedback text on screen ("Perfect!", "Good", "Sloppy") (P1)
- [ ] **UIHD-06**: Archives screen (spell compendium/lore viewer) (P3)
- [ ] **UIHD-07**: Sigils screen (gesture practice/reference) (P3)
- [ ] **UIHD-08**: Settings screen (difficulty, accessibility options) (P3)
- [x] **UIHD-09**: Integration with existing dark mystical aesthetic (teal/gold/navy, Cinzel Decorative font) (P0)

### Visual Effects & Polish

- [ ] **VFXP-01**: Spell casting particle burst at origin point (P1)
- [ ] **VFXP-02**: Projectile trail particles along spell trajectory (P1)
- [ ] **VFXP-03**: Impact explosion particles on enemy hit (P1)
- [ ] **VFXP-04**: Enemy death particles and fade animation (P1)
- [ ] **VFXP-05**: Screen shake on big spells (3px normal, 5px ultimate) (P1)
- [ ] **VFXP-06**: Object-pooled particle system (200-300 max desktop) with auto-reduce on FPS drop (P0)
- [x] **VFXP-07**: Gesture trail with glow/gradient effect during drawing (P0)
- [x] **VFXP-08**: Spell color coding -- blue/cyan (free), purple/magenta (utility), gold/orange/red (ultimate) (P1)

### Accessibility

- [ ] **ACCS-01**: Colorblind mode toggle (alternative color palette for spell tiers) (P3)
- [ ] **ACCS-02**: Adjustable UI scale (P3)
- [ ] **ACCS-03**: Practice/sandbox mode for gesture learning (P3)
- [x] **ACCS-04**: Keyboard shortcuts as emergency fallback for gesture failures (P1)

## v2 Requirements

Deferred to post-hackathon. Not in current roadmap.

### Audio & Sound

- **AUDI-01**: Spell cast sound effects per spell type
- **AUDI-02**: Enemy death sound effects
- **AUDI-03**: Background music (ambient mystical theme)
- **AUDI-04**: Ultimate spell dramatic audio cue
- **AUDI-05**: UI interaction sounds (menu clicks, spell selection)

*Note: Audio marked out of scope in PROJECT.md ("visual-first for hackathon demo, add if time permits"). Moved to v2 unless time allows.*

### Advanced Features

- **ADVN-01**: Procedural endless mode with scaling difficulty waves
- **ADVN-02**: Spell combo system (chained gestures for enhanced effects)
- **ADVN-03**: Save/load system via localStorage
- **ADVN-04**: Performance stats overlay (FPS counter, entity count)
- **ADVN-05**: Mobile touch optimization

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multiplayer/online features | Solo game, hackathon timeline doesn't support networking |
| Mobile native app | Web browser only, demo on laptop |
| Monetization system | Hackathon demo, no payments |
| Backend/server | Fully client-side game |
| User accounts/persistent save | Local storage at most, session-based for demo |
| Story/narrative system | 1-sentence tagline sufficient ("Last wizard defending reality") |
| Procedural level generation | Handcrafted 3-5 levels faster and more reliable for demo |
| Complex pathfinding (A*) | Simple chase AI sufficient for hackathon |
| TensorFlow.js ML recognition | $1 Recognizer sufficient; ML adds complexity without hackathon ROI |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| FOUND-06 | Phase 1 | Complete |
| FOUND-07 | Phase 1 | Complete |
| GEST-01 | Phase 2 | Complete |
| GEST-02 | Phase 2 | Complete |
| GEST-03 | Phase 2 | Complete |
| GEST-04 | Phase 2 | Complete |
| GEST-05 | Phase 2 | Complete |
| GEST-06 | Phase 2 | Complete |
| SPEL-01 | Phase 3 | Complete |
| SPEL-02 | Phase 3 | Complete |
| SPEL-03 | Phase 3 | Complete |
| SPEL-04 | Phase 3 | Complete |
| SPEL-05 | Phase 5 | Pending |
| SPEL-06 | Phase 5 | Pending |
| SPEL-07 | Phase 5 | Pending |
| SPEL-08 | Phase 5 | Pending |
| SPEL-09 | Phase 5 | Pending |
| SPEL-10 | Phase 3 | Complete |
| SPEL-11 | Phase 5 | Pending |
| SPEL-12 | Phase 3 | Complete |
| COMB-01 | Phase 4 | Pending |
| COMB-02 | Phase 4 | Pending |
| COMB-03 | Phase 4 | Pending |
| COMB-04 | Phase 4 | Pending |
| COMB-05 | Phase 4 | Pending |
| COMB-06 | Phase 4 | Pending |
| COMB-07 | Phase 4 | Pending |
| COMB-08 | Phase 4 | Pending |
| COMB-09 | Phase 4 | Pending |
| COMB-10 | Phase 4 | Pending |
| MANA-01 | Phase 5 | Pending |
| MANA-02 | Phase 5 | Pending |
| MANA-03 | Phase 5 | Pending |
| MANA-04 | Phase 5 | Pending |
| MANA-05 | Phase 5 | Pending |
| LEVL-01 | Phase 6 | Pending |
| LEVL-02 | Phase 6 | Pending |
| LEVL-03 | Phase 6 | Pending |
| LEVL-04 | Phase 6 | Pending |
| LEVL-05 | Phase 6 | Pending |
| LEVL-06 | Phase 6 | Pending |
| LEVL-07 | Phase 6 | Pending |
| LEVL-08 | Phase 6 | Pending |
| LEVL-09 | Phase 6 | Pending |
| LEVL-10 | Phase 6 | Pending |
| UIHD-01 | Phase 1 | Complete |
| UIHD-02 | Phase 4 | Pending |
| UIHD-03 | Phase 5 | Pending |
| UIHD-04 | Phase 5 | Pending |
| UIHD-05 | Phase 3 | Complete |
| UIHD-06 | Phase 6 | Pending |
| UIHD-07 | Phase 6 | Pending |
| UIHD-08 | Phase 6 | Pending |
| UIHD-09 | Phase 1 | Complete |
| VFXP-01 | Phase 7 | Pending |
| VFXP-02 | Phase 7 | Pending |
| VFXP-03 | Phase 7 | Pending |
| VFXP-04 | Phase 7 | Pending |
| VFXP-05 | Phase 7 | Pending |
| VFXP-06 | Phase 7 | Pending |
| VFXP-07 | Phase 2 | Complete |
| VFXP-08 | Phase 3 | Complete |
| ACCS-01 | Phase 6 | Pending |
| ACCS-02 | Phase 6 | Pending |
| ACCS-03 | Phase 6 | Pending |
| ACCS-04 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 71 total
- Mapped to phases: 71
- Unmapped: 0

---
*Requirements defined: 2026-02-06*
*Last updated: 2026-02-06 after roadmap creation*
