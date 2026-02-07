# Project Research Summary

**Project:** AETHOS: Fragments of the Void
**Domain:** Gesture-based spell casting web game (hackathon)
**Researched:** 2026-02-06
**Confidence:** HIGH

## Executive Summary

AETHOS is a gesture-based spell casting game for a 24-48 hour hackathon where drawing shapes (circle, triangle, zigzag) casts spells. The research converges on a clear architecture: **Vite + React 19 + Vanilla Canvas 2D + $1 Recognizer + Zustand**. Skip heavy frameworks (Phaser, PixiJS, TensorFlow.js) that add learning curves. The proven pattern is React for UI/menus/HUD overlays + Canvas for 60fps game rendering, with Zustand bridging the two layers via useRef (no React state in game loop).

The killer differentiator is **trajectory-based aiming** — players draw the spell shape (circle) THEN continue drawing to aim where the projectile flies. This is novel, demonstrable, and judges can immediately see the innovation. Combined with a 3-tier mana system (free/utility/ultimate spells), this creates strategic depth beyond typical gesture games like Magic Touch or VR titles like The Wizards.

**Critical risks:** (1) React re-render storms killing FPS if Canvas is inside stateful components, (2) gesture recognition failing live due to different input devices, (3) scope creep destroying timeline, (4) no "juice" (particles, screen shake, sound) making working mechanics feel broken. The research provides specific mitigation for each: isolate Canvas from React state using useRef, test gestures on multiple devices early, ruthlessly cut to 2 spells + 1 enemy MVP, and budget 2 hours minimum for visual/audio feedback.

## Key Findings

### Recommended Stack

**Core decision:** Velocity over architectural purity. The 2026 standard for hackathon web games is Vite (CRA officially sunset Feb 2025, 5x faster builds) + React 19 (already in use) + Vanilla Canvas 2D (no framework learning curve, 60fps achievable with 200-300 particles). TypeScript is omitted for hackathon speed — JavaScript's flexibility enables faster iteration.

**Core technologies:**
- **Vite 6.0+**: Build tool — sub-second HMR, 5x faster than CRA, ES modules native
- **React 19.2+**: UI layer (menus, HUD, overlays) — already in use, React Compiler auto-memoization helps performance
- **Vanilla HTML5 Canvas 2D**: Game rendering — direct control, no Phaser/PixiJS complexity, proven 60fps for 2D particle games
- **$1 Recognizer**: Gesture recognition — 100 lines of code, 0.2ms recognition, won UIST 2024 Lasting Impact Award, perfect for circle/triangle/zigzag
- **Zustand 5.0+**: Game state management — sub-10KB, no boilerplate, 40% project adoption 2026, bridges Canvas and React without Context re-render issues
- **Tailwind CSS 4**: UI styling — already in use, v4 delivers 5x faster builds, zero-config CSS-first setup

**Critical version requirements:** React 19+ (hooks behavior), Vite 6+ (performance), Tailwind 4+ (Oxide engine). All are GA releases with stable documentation.

### Expected Features

**Must have (table stakes) — 22-30 hours total:**
- **Gesture recognition (3-5 shapes)**: Circle, triangle, zigzag minimum — without this there's no game
- **Visual spell effects**: Particle trails, projectile rendering — players must SEE their spell fire
- **One enemy type**: Slime with simple chase AI, health bar, death animation
- **Hit detection**: Basic collision (circle/AABB), visual feedback on damage
- **Tutorial (first 3 levels)**: Level 1 draw circle, Level 2 aim, Level 3 kill 3 enemies — judges won't read instructions
- **Win/loss condition**: "Wave cleared" or "Castle destroyed" with restart button
- **Audio feedback**: Spell cast sound, enemy death, background music — silent games feel broken

**Should have (differentiators) — pick 1-2 MAX:**
- **Trajectory-based aiming** (6-8 hours): Draw spell shape THEN continue for trajectory — THIS IS THE KILLER FEATURE (5-star demo impact)
- **3-tier mana system** (4-5 hours): Free (0 mana), Utility (35 mana), Ultimate (100 mana) — strategic depth beyond cooldowns
- **Screen shake + particle juice** (3-4 hours): Makes every action feel powerful — hackathon demos live or die on "juice"
- **Spell evolution** (2-3 hours): Same gesture = different effect based on mana tier (Circle = Magic Missile at 0 mana OR Meteor at 100)

**Defer (v2+) — explicitly cut for hackathon:**
- 20 levels (build 3-5 tutorial levels, make last level endless)
- 8+ spell types (3-4 core spells shows system, more adds diminishing returns)
- Complex enemy AI (simple chase toward player is sufficient)
- Story/lore (1-sentence tagline: "Last wizard defending reality")
- Multiplayer (networking is a hackathon killer)
- Mobile responsive (demo on laptop, acknowledge "mobile next" if asked)

**Reality check:** Hackathon projects accomplish 25% of planned scope. MVP = 2 gestures + 1 enemy + 3 levels is achievable in 12 hours. Everything else is gravy.

### Architecture Approach

The architecture is a **hybrid React UI + Canvas game engine pattern**. React owns navigation, menus, HUD overlays (HP, mana, spell bars). Canvas owns the game loop (requestAnimationFrame), entity management, physics, collisions, particle rendering. The two layers communicate via a useRef bridge — game engine instance lives outside React's reactivity system to avoid re-render storms.

**Major components:**
1. **GameEngine (Canvas)** — Main orchestrator with fixed timestep accumulator game loop, owns all entity state, coordinates subsystems (Input, Physics, Collision, Rendering, Particles)
2. **UI Layer (React)** — HomePage (existing menu), GamePage (canvas container + HUD overlays), StatsScreen (post-level), LoadoutScreen (pre-level spell selection)
3. **Gesture Recognition (Web Worker)** — Offloaded to avoid blocking main thread, $1 Recognizer runs on input path points, returns shape + confidence, trajectory extracted from post-recognition drawing
4. **Spell System** — Data-driven definitions (spell configs in JSON-like objects), handles casting, cooldowns, accuracy modifiers, spawns projectile entities
5. **Enemy System** — Spawn manager + AI behaviors (chase, ranged, boss patterns), health management, loot drops (mana)
6. **State Bridge (Zustand)** — Canvas reads/writes store directly (no subscriptions in game loop), React components subscribe to relevant slices (e.g., `useStore(s => s.hp)`), throttled HUD updates (10Hz, not 60Hz)

**Critical pattern:** Canvas ref stored in `useRef`, game engine instance created in `useEffect` with empty deps (runs once), animation loop never re-initializes. React state used ONLY for UI (score, health display), NOT for game entities (positions, velocities). This avoids the #1 killer of React+Canvas games: re-render storms destroying frame rate.

**Game loop:** Fixed timestep accumulator (16.67ms updates for deterministic physics) with variable rendering (requestAnimationFrame adapts to refresh rate). Delta time passed to all systems prevents refresh rate dependency (60Hz vs 120Hz displays produce identical gameplay).

### Critical Pitfalls

**Top pitfalls with prevention strategies:**

1. **Display refresh rate dependency (CRITICAL)** — Game physics tied to frame rate causes 2x speed on 120Hz vs 60Hz displays. Judges' laptops may differ from dev machine. **Prevention:** Use delta time in game loop — `player.x += velocity * deltaTime`, never `player.x += 5` per frame. Test with Chrome CPU throttling.

2. **React re-render storm destroying FPS (CRITICAL)** — Every state change (health, mana, enemy spawn) triggers Canvas re-mount, killing animation loop. FPS drops 60 → 15. **Prevention:** Canvas ref in `useEffect` with empty deps, game state in `useRef` (not useState), only UI state in React. Pattern: Canvas layer (pure JS, 60fps) + React layer (UI only, 1-2Hz updates) + useRef bridge.

3. **Gesture recognition fails live (CRITICAL)** — Works in dev, fails 50% during demo due to trackpad vs mouse, lighting, judge's drawing speed. **Prevention:** Use canvas drawing path (2D coordinates), NOT camera-based. Generous tolerance (circle = 60-70% circularity acceptable). Visual feedback on every stroke. Test on multiple devices early. Have keyboard shortcuts as emergency fallback.

4. **Particle system memory leak (PERFORMANCE)** — 100MB → 2GB after 2 minutes, browser crashes mid-demo. Creating new particle objects every frame without cleanup. **Prevention:** Object pooling from start (pre-allocate 200-300 particle objects, reuse via `active` flag). Max particle limit enforced (200-300 desktop, 50-80 mobile).

5. **No "juice" makes working game feel broken (GAME FEEL)** — Spell casting works mechanically but no particle burst, screen shake, sound. Judges think gestures aren't registering. **Prevention:** Minimum viable juice = gesture trail (bright, glowing), cast confirmation flash + sound, impact particles, enemy white flash on hit, 3px screen shake on big spells. Budget 2 hours non-negotiable.

6. **Scope creep kills timeline (HACKATHON)** — 20 spells + 5 enemies + boss + procedural gen planned. 24 hours in, have 2 spells, nothing playable. **Prevention:** MVP = 2 gestures + 1 enemy + 3 levels (12 hours). Feature tiers: MUST (circle fireball, damage, health), SHOULD (2nd gesture, effects, score), COULD (more types, endless). 16-hour cutoff: no new features after hour 16, only polish + bugfix.

7. **No requestAnimationFrame cleanup (ARCHITECTURE)** — Component unmounts (pause, navigate away), animation loop keeps running. Memory leak, eventual crash. **Prevention:** Store RAF ID, `cancelAnimationFrame(rafId)` in useEffect cleanup return function. Test by navigating away, check CPU usage stays low.

8. **Leaving testing to last hour (HACKATHON)** — Hour 22: "Let me test on phone — OH NO gestures don't work on touch, canvas scaling broken." **Prevention:** Hour 8 first full playthrough, hour 16 friend playtest, hour 20 demo device test. Continuous testing every 2 hours (10min test breaks).

**Phase-specific warnings:**
- **Foundation (Phase 1):** Must have delta time + useRef pattern or 4-6 hours lost to rewrite
- **Gesture Recognition (Phase 2-3):** Test with friend on different device by hour 12 or 3-4 hours lost re-tuning
- **Visual Effects (Phase 4):** Implement object pooling from start or 2 hours lost debugging crashes
- **Polish (Phase 5-6):** Budget 2 hours for juice (particles, shake, sound) — not optional, makes or breaks demo

## Implications for Roadmap

Based on research, the roadmap should follow a **linear dependency chain** where each phase builds on the previous and delivers a demoable vertical slice. The hackathon timeline (24-48 hours solo) demands ruthless scope control and front-loading of the core differentiator (trajectory aiming).

### Suggested Phase Structure (7 phases)

**Phase 1: Foundation (Canvas + Game Loop) — 4-6 hours**
**Rationale:** Everything depends on Canvas rendering and game loop working correctly. Must establish React-Canvas isolation pattern and delta time from the start to avoid costly rewrites.
**Delivers:** Vite + React scaffold, Canvas ref with useRef, fixed timestep game loop with delta time, input capture (mouse/touch drawing visible as trail), basic entity rendering (test circles)
**Addresses:** Stack setup (Vite, React 19, Tailwind 4), Canvas 2D rendering foundation
**Avoids:** Pitfall #1 (refresh rate dependency), Pitfall #2 (React re-render storms), Pitfall #7 (no RAF cleanup), Pitfall #10 (Canvas in React state)
**Research flag:** Standard pattern, skip research-phase

---

**Phase 2: Gesture Recognition — 6-8 hours**
**Rationale:** Core mechanic that differentiates the game. Must work reliably before building spells/combat on top.
**Delivers:** $1 Recognizer integration (Web Worker optional if time), 3 gesture templates (circle, triangle, line), visual feedback on recognition (shape name displayed, trail color change), accuracy scoring (0.5x-1.0x damage modifier)
**Addresses:** Gesture recognition system, input validation, feedback loops
**Uses:** $1 Recognizer library, Canvas path recording, gesture tolerance tuning
**Avoids:** Pitfall #3 (recognition fails live), Pitfall #6 (too strict matching), Pitfall #8 (background clutter confuses recognition)
**Research flag:** Needs basic research on $1 Recognizer API + tuning values (1-2 hour research spike)

---

**Phase 3: Core Spell Casting — 6-8 hours**
**Rationale:** Trajectory-based aiming is the killer feature. Must be implemented early to validate feasibility and wow-factor.
**Delivers:** SpellManager with 2 free spells (Quick Shot = circle, Magic Missile = triangle), projectile entities spawned on cast, trajectory extracted from continued drawing post-recognition, projectile movement with basic physics, visual spell trails (particles or gradient lines)
**Addresses:** DIFFERENTIATOR (trajectory aiming), spell system foundation, projectile physics
**Uses:** Zustand for spell state, Canvas rendering for projectiles, gesture path as trajectory vector
**Implements:** Spell System architecture component, PhysicsSystem for projectile movement
**Avoids:** Pitfall #7 (input latency — immediate visual response), Pitfall #15 (no juice — add spell trails)
**Research flag:** May need 1-hour research spike on bezier curve trajectory if going for curved paths (optional)

---

**Phase 4: Combat System (Enemies + Collision) — 6-8 hours**
**Rationale:** Need something to cast spells AT. Collision detection completes the core loop.
**Delivers:** EnemyManager with 1 enemy type (slime with chase AI), CollisionSystem (AABB for projectiles/enemies), damage application (enemy health reduction), enemy death (remove entity, spawn death particles, mana drop), Player HP tracking (contact damage from enemies)
**Addresses:** Table stakes (one enemy type, hit detection), mana system (kill bonuses)
**Uses:** Entity component pattern (enemy entities with health, AI state), collision detection algorithms
**Implements:** Enemy System, CollisionSystem architecture components
**Avoids:** Pitfall #4 (particle memory leak — use pooling for death particles), Pitfall #17 (no balance — use reference values from research)
**Research flag:** Standard chase AI + AABB collision, skip research-phase

---

**Phase 5: Mana + Progression — 4-6 hours**
**Rationale:** 3-tier mana system is the secondary differentiator. Enables ultimate spell and strategic depth.
**Delivers:** ManaSystem (current/max mana, passive regen 5/sec, kill bonuses), visual mana bar with tier indicators (0-35 blue, 35-100 purple glow, 100 gold pulse), 1 utility spell (Shield at 35 mana), 1 ultimate spell (Meteor Storm at 100 mana), HUD displays mana thresholds ("Utility Ready", "Ultimate Ready")
**Addresses:** DIFFERENTIATOR (3-tier mana), utility/ultimate spells, resource management
**Uses:** Zustand for mana state, React HUD components for visual bars
**Implements:** ManaSystem, Resource System architecture components
**Avoids:** Pitfall #16 (invisible game state — clear UI indicators)
**Research flag:** Skip research, straightforward state management

---

**Phase 6: Tutorial + Level Structure — 4-6 hours**
**Rationale:** Judges need guided experience. Tutorial demonstrates mechanics in first 30 seconds of demo.
**Delivers:** LevelManager (load level configs, check objectives, spawn waves), 3 tutorial levels (Level 1: draw circle cast Quick Shot kill 1 slime, Level 2: draw triangle aim trajectory kill 2 slimes, Level 3: use ultimate kill 3 slimes), TutorialOverlay React component (on-screen text prompts), win/loss screens (simple "Wave Cleared" or "Defeated" with restart button)
**Addresses:** Table stakes (tutorial, win/loss condition), demo structure
**Uses:** Level config JSON objects, React overlays for tutorial text, state machine for level flow
**Implements:** LevelManager architecture component
**Avoids:** Pitfall #11 (scope creep — 3 levels only), Pitfall #16 (invisible state — tutorial guides player)
**Research flag:** Skip research, standard tutorial pattern

---

**Phase 7: Polish ("Juice" + Audio) — 4-6 hours**
**Rationale:** This is what makes hackathon demos memorable. Working mechanics + juice = winning project.
**Delivers:** Particle system (object pooled, 200-300 max), spell cast particles (burst at origin), impact particles (explosion at hit point), screen shake (3px on big spells, 5px on ultimate), audio effects (spell cast, enemy death, ultimate roar, background music), accuracy feedback UI ("Perfect!", "Good", "Sloppy" text on HUD), visual polish (smooth transitions, gesture trail improvements)
**Addresses:** Table stakes (audio feedback), game feel juice (NON-NEGOTIABLE for demo quality)
**Uses:** Custom Canvas particle implementation (not library for hackathon speed), Web Audio API, react-howler (optional)
**Implements:** ParticleSystem architecture component with object pooling
**Avoids:** Pitfall #4 (memory leak — pooling enforced), Pitfall #5 (rendering inefficiency — use whole numbers, globalAlpha), Pitfall #15 (no juice — this entire phase addresses it)
**Research flag:** Skip research, particle tutorials abundant

---

### Phase Ordering Rationale

**Dependency chain:** Foundation (Canvas + loop) → Gesture Recognition (core input) → Spell Casting (mechanics) → Combat (enemies + collision) → Mana (resource system) → Tutorial (structure) → Polish (feel)

**Why this order:**
- **Canvas infrastructure first** — Everything else renders on Canvas, must work correctly from start
- **Gestures before spells** — No point building spell system if gesture input doesn't work
- **Trajectory aiming early (Phase 3)** — Killer feature must be validated early in timeline, allows pivot if too complex
- **Combat after spells** — Need projectiles working before testing collision
- **Mana after combat** — Kill bonuses require enemies, mana tiers are icing on combat cake
- **Tutorial after mechanics** — Can't teach what doesn't exist yet
- **Polish last but mandatory** — 2 hours minimum for juice, moves project from "works" to "wins"

**Critical path for MVP:** Phases 1-4 deliver playable core loop (draw gesture → spell fires → enemy dies). Phases 5-7 add strategic depth + demo polish.

**Time-constrained fallbacks:**
- If behind schedule by Hour 16: Skip Phase 5 (mana tiers), keep free spells only
- If behind schedule by Hour 20: Skip Phase 6 tutorial overlays, use text-only instructions
- If behind schedule by Hour 22: Reduce Phase 7 polish to screen shake + spell cast sound only

**Parallel work opportunities:**
- Audio asset search (Phase 7) can happen during Phases 4-6 implementation
- Tutorial text (Phase 6) can be written during Phase 5 testing
- Balance tuning (enemy HP, spell damage) happens continuously from Phase 4 onward

### Research Flags

**Phases needing phase-specific research:**
- **Phase 2 (Gesture Recognition):** 1-2 hour research spike on $1 Recognizer API, gesture tolerance tuning, and Web Worker integration (if needed). Library is simple but tuning thresholds requires experimentation.
- **Phase 3 (Trajectory Aiming):** Optional 1-hour spike if implementing curved bezier paths instead of straight line trajectories. Straight lines are faster to implement and still novel.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** React + Canvas pattern is well-documented, fixed timestep game loop is standard
- **Phase 4 (Combat):** Chase AI + AABB collision are textbook implementations, abundant tutorials
- **Phase 5 (Mana):** Straightforward state management, no novel algorithms
- **Phase 6 (Tutorial):** Standard level state machine, React overlays are trivial
- **Phase 7 (Polish):** Particle tutorials everywhere, Web Audio API well-documented

**Overall research strategy:** The stack and architecture research (already complete) covers 90% of what's needed. Only Phase 2 requires narrow technical research on $1 Recognizer tuning. Everything else is "write the code" mode.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | **HIGH** | Vite + React 19 + Canvas 2D + $1 Recognizer all proven for hackathon games. CRA sunset makes Vite the clear choice. Zustand in 40% of projects 2026. All sources current and authoritative. |
| **Features** | **HIGH** | Table stakes validated against successful gesture games (Magic Touch, The Wizards). Differentiators (trajectory aiming, 3-tier mana) are novel but technically feasible. Scope validated against hackathon timelines. |
| **Architecture** | **HIGH** | React + Canvas hybrid pattern extensively documented. Game loop (fixed timestep accumulator) is industry standard. React-Canvas bridge (useRef) verified in multiple sources. ECS-lite pattern proven for hackathon speed. |
| **Pitfalls** | **HIGH** | All critical pitfalls have verified preventions. Refresh rate dependency, React re-renders, gesture recognition failures are known issues with proven solutions. Hackathon time traps based on actual post-mortems. |
| **Hackathon Timeline** | **MEDIUM** | 22-30 hours for core (table stakes) is feasible in 48-hour hackathon with buffer. Ambitious feature set (PROJECT.md lists 20 levels, 8 spells) requires ruthless cutting. Success depends on scope discipline. |
| **Performance (60fps)** | **MEDIUM** | Canvas 2D proven for 200-300 particles at 60fps on desktop, 50-80 mobile. Achievable with optimization (object pooling, particle limits). Mobile performance unknown until tested. Risk: particle counts during intense combat. |

**Overall confidence:** **HIGH**

The stack, architecture, and feature set are well-researched and aligned with 2026 best practices. All core technologies have stable GA releases with documentation. Critical risks have specific mitigations. The only uncertainty is timeline feasibility — the ambitious feature set from PROJECT.md must be aggressively scoped down to the suggested 7-phase roadmap.

### Gaps to Address

**Identified gaps and handling:**

1. **Mobile/touch input testing** — Research covers mouse + trackpad, but touch gestures (touchstart, touchmove, touchend) may have different behavior. **Handling:** Test on mobile early in Phase 2 (gesture recognition), have fallback to simplified gestures if touch is problematic.

2. **Balance tuning without playtesting** — Research provides reference values (enemy HP 20-30, damage 10-20) but actual feel unknown until tested. **Handling:** Build runtime balance controls (debug keys to adjust values), tune during Phase 4-5 implementation, final balance in Phase 6.

3. **Particle performance on lower-end laptops** — Research states 200-300 particles at 60fps on desktop but judge laptops may be older. **Handling:** Build configurable particle limits, detect frame rate drops in game loop, auto-reduce particle count if FPS <55.

4. **Gesture recognition accuracy across drawing speeds** — Research mentions normalization but doesn't specify thresholds. **Handling:** Phase 2 research spike includes testing fast vs slow drawing, tuning $1 Recognizer resampling parameters.

5. **Trajectory aiming UX** — Novel feature means no proven patterns. Players may not understand they need to continue drawing after shape recognition. **Handling:** Tutorial in Phase 6 explicitly teaches this (Level 2 objective), visual cue (trail color changes when trajectory capture starts).

6. **Web Worker overhead** — Research mentions offloading gesture recognition but doesn't measure postMessage latency. **Handling:** Implement synchronously first (Phase 2), move to Worker only if main thread blocking detected (optional Phase 3 optimization).

7. **Sound asset licensing** — Research suggests freesound.org but doesn't verify CC0 availability for spell sounds. **Handling:** Audio is last priority (Phase 7), have placeholder sounds (beeps) as fallback, search assets during Phase 4-6 implementation.

## Sources

### Primary (HIGH confidence)

**Stack (STACK.md):**
- [React 19.2 release notes](https://react.dev/blog/2025/10/01/react-19-2) — Official React docs, GA release
- [Vite 6.0 announcement](https://vite.dev/blog/announcing-vite6) — Official Vite blog, performance benchmarks
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) — Official Tailwind blog, Oxide engine details
- [$1 Recognizer research](https://depts.washington.edu/acelab/proj/dollar/index.html) — Original UW research, UIST 2024 award
- [Zustand npm](https://www.npmjs.com/package/zustand) + [comparison 2026](https://medium.com/@sparklewebhelp/redux-vs-zustand-vs-context-api-in-2026-7f90a2dc3439) — Official package, adoption stats

**Features (FEATURES.md):**
- [Best Gesture Recognition Libraries 2025](https://portalzine.de/best-gesture-recognition-libraries-in-javascript-2025/) — Library comparison, Jager 0.2ms benchmark
- [Magic Touch: Wizard for Hire](https://apps.apple.com/us/app/magic-touch-wizard-for-hire/id946917251) — Competitive analysis, proven gesture game
- [10 Winning Hacks: Hackathon Best Practices](https://medium.com/@BizthonOfficial/10-winning-hacks-what-makes-a-hackathon-project-stand-out-818d72425c78) — Hackathon demo strategies
- [Surviving Game Hackathons](https://medium.com/revelry-labs/surviving-a-game-hackathon-like-the-48-hour-global-game-jam-1a2e2e696179) — Timeline validation

**Architecture (ARCHITECTURE.md):**
- [React + Canvas Best Practices 2026](https://jslegenddev.substack.com/p/why-use-react-for-game-development) — useRef + overlay pattern
- [Performant Game Loops in JavaScript](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/) — Fixed timestep accumulator pattern
- [Why React Lags but Canvas Runs 60FPS](https://dev.to/yzbkaka_dev/why-your-react-app-lags-but-this-canvas-game-runs-at-60fps-2h1d) — React-Canvas isolation techniques
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — Official Web API docs

**Pitfalls (PITFALLS.md):**
- [Standardize Framerate for Different Monitors](https://chriscourses.com/blog/standardize-your-javascript-games-framerate-for-different-monitors) — Delta time implementation
- [React Optimization 2026 Edition](https://medium.com/@muhammadshakir4152/react-js-optimization-every-react-developer-must-know-2026-edition-e1c098f55ee9) — Re-render prevention
- [Optimizing HTML5 Canvas for Games](https://codetheory.in/optimizing-html5-canvas-to-improve-your-game-performance/) — Rendering performance techniques
- [Hackathon Pitfalls to Avoid](https://sloanreview.mit.edu/article/avoid-these-five-pitfalls-at-your-next-hackathon/) — MIT Sloan Review, scope management

### Secondary (MEDIUM confidence)

- [Component-Based Game Architecture](https://gameprogrammingpatterns.com/component.html) — Game Programming Patterns book, ECS concepts
- [Hand Gesture Recognition Review](https://www.mdpi.com/2313-433X/6/8/73) — Academic paper, recognition techniques
- [Measuring Responsiveness in Video Games](https://www.gamedeveloper.com/design/measuring-responsiveness-in-video-games) — Gamasutra, input latency targets
- [Gesture Detection in Complex Background](https://www.mdpi.com/2076-3417/13/7/4480) — Academic paper, layer separation

### Tertiary (LOW confidence, needs validation)

- [How to Avoid Scope Creep](https://www.codecks.io/blog/2025/how-to-avoid-scope-creep-in-game-development/) — Blog post, anecdotal advice
- [Finding Balance Before Playtesting](https://www.leagueofgamemakers.com/finding-balance-before-playtesting/) — Community advice, balance ratios

---

**Research completed:** 2026-02-06
**Ready for roadmap:** Yes

**Next steps for orchestrator:**
1. Use suggested 7-phase structure as roadmap foundation
2. Flag Phase 2 for narrow technical research (1-2 hours on $1 Recognizer tuning)
3. Enforce scope discipline — cut PROJECT.md's 20 levels to 3-5 tutorial levels
4. Front-load trajectory aiming (Phase 3) to validate killer feature early
5. Budget 2 hours minimum for Phase 7 polish (non-negotiable for demo quality)
