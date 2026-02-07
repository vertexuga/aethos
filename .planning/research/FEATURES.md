# Features Research: Gesture-Based Spell Casting Game

**Project:** AETHOS: Fragments of the Void
**Domain:** Gesture-based spell casting web game
**Researched:** 2026-02-06
**Context:** Solo hackathon project, 24-48 hours, UGAHacks11
**Confidence:** HIGH (based on established game design patterns, hackathon best practices, and technical feasibility research)

---

## Executive Summary

Gesture-based spell casting games succeed through **tight core loops** (draw → recognize → instant feedback → impact). For a hackathon demo, judges prioritize **one polished feature over five half-baked ones**. Table stakes are simple: gesture recognition working reliably, immediate visual feedback (particles/screen shake), and a clear win/loss condition. Differentiators come from **innovation in gesture design** (trajectory-based aiming, spell chaining) and **impressive polish** ("juice" effects that make every action feel impactful).

The 3-tier mana system in your design doc is a strong differentiator. Most games use simple cooldowns or MP bars—your free/utility/ultimate split creates strategic depth while remaining hackathon-feasible.

**Critical insight from research:** Games like Magic Touch succeed because recognition happens in **~0.2ms** (Jager library benchmark) and feedback is **instant**. Tutorial progression introducing one mechanic per level is industry standard and works—stick with it.

---

## Table Stakes (Must Have for Demo)

These features must work or the demo falls flat. Missing any of these = confused judges.

| Feature | Why Expected | Complexity (Hours) | Implementation Priority | Notes |
|---------|--------------|-------------------|------------------------|-------|
| **Gesture Recognition (3-5 shapes)** | Core mechanic—without this, there's no game | 6-8 hours | P0 | Use Jager or $1 Recognizer. Start with circle, triangle, zigzag. Don't attempt all 8 spells. |
| **Visual Spell Effects** | Players need to SEE their spell fire | 3-4 hours | P0 | Particle systems for projectiles. Canvas-based trails acceptable. Reuse assets. |
| **One Enemy Type** | Need something to cast spells at | 4-5 hours | P0 | Simple pathfinding toward player. Health bar. Death animation (fade/particle burst). |
| **Hit Detection** | Spells must visibly damage enemies | 2-3 hours | P0 | Basic collision detection (circle/AABB). Don't overcomplicate. |
| **Tutorial (First 3 Levels)** | Judges won't read instructions | 4-5 hours | P0 | Level 1: Draw circle. Level 2: Aim spell. Level 3: Kill 3 enemies. That's it. |
| **Win/Loss Condition** | Must have closure for demo loop | 1-2 hours | P0 | Simple: "Wave cleared!" or "Castle destroyed!" Restart button mandatory. |
| **Audio Feedback** | Silent games feel broken | 2-3 hours | P1 | Spell cast sound, enemy death sound, background music. Use free assets (freesound.org). |

**Total minimum viable demo:** ~22-30 hours (feasible for 48-hour hackathon with buffer for debugging)

**Core gameplay loop (must demonstrate in first 30 seconds of pitch):**
1. Enemy appears → 2. Draw gesture → 3. Spell fires with particles/sound → 4. Enemy takes damage/dies → 5. Next wave

---

## Differentiators (Wow Factor)

Features that make judges say "That's clever!" or "I haven't seen that before." Pick **1-2 maximum** for hackathon scope.

| Feature | Value Proposition | Complexity (Hours) | Demo Impact | Hackathon Feasibility |
|---------|-------------------|-------------------|-------------|----------------------|
| **Trajectory-Based Aiming** | Draw spell THEN continue drawing for aim direction | 6-8 hours | ⭐⭐⭐⭐⭐ | HIGH—this is your killer feature. Demo this first. |
| **3-Tier Mana System** (Free/Utility/Ultimate) | Strategic resource management beyond cooldowns | 4-5 hours | ⭐⭐⭐⭐ | HIGH—differentiated from typical mana bars. Color-code UI. |
| **Gesture Combo System** | Quick Draw → Circle = Flaming Missile | 8-10 hours | ⭐⭐⭐⭐⭐ | MEDIUM—high payoff but scope risk. Only if core loop done by Hour 20. |
| **Screen Shake + Particle Juice** | Every action feels POWERFUL | 3-4 hours | ⭐⭐⭐⭐ | HIGH—"juice" is what makes hackathon demos memorable. Budget 3 hours. |
| **Dynamic Difficulty** | Wave intensity adapts to player performance | 6-8 hours | ⭐⭐⭐ | LOW—judges won't notice in 3-min demo. Skip for hackathon. |
| **Gesture Miscast Mechanic** | Wrong shape = weak spell or backfire | 3-4 hours | ⭐⭐⭐⭐ | MEDIUM—funny/memorable but adds failure cases. Risky. |
| **Spell Evolution** | Same gesture = different effect based on mana tier | 2-3 hours | ⭐⭐⭐⭐ | HIGH—leverages your 3-tier system. Circle = Magic Missile (free) OR Meteor (ultimate). |

**Recommended differentiator strategy for 48-hour solo hackathon:**
- **MUST INCLUDE:** Trajectory-based aiming (your USP) + Screen shake/particles (makes demo feel polished)
- **IF TIME PERMITS:** 3-tier mana visual indicator + spell evolution across tiers
- **SKIP:** Combos, dynamic difficulty, miscast mechanics

**Why trajectory aiming wins hackathons:** It's **novel** (most gesture games stop at shape recognition), **demonstrable** (judges can see the line you draw becoming projectile path), and **feels intuitive** (natural extension of the gesture).

---

## Nice-to-Have (If Time Permits)

Polish features that improve experience but aren't critical for demo success.

| Feature | Benefit | Time Cost | When to Build |
|---------|---------|-----------|---------------|
| **Multiple Enemy Types** (2-3 variants) | Shows progression depth | 4-5 hours | If core loop done by Hour 24 |
| **Upgrade System** | Post-wave stat improvements | 5-6 hours | Only if levels 1-5 playable |
| **Endless Mode** | Replayability signal | 2-3 hours | Last 4 hours of hackathon |
| **Leaderboard** | Competitive element | 3-4 hours | Skip—not valuable for solo demo |
| **Spell Hotbar** | See equipped spells | 2 hours | Good UI polish if time allows |
| **Health/Shield UI** | Player survivability indicator | 2-3 hours | Medium priority after P0 features |

**Strategic approach:** Don't start any "nice-to-have" until tutorial + 1 enemy type + gesture recognition are **demo-ready**. Judges evaluate what works, not what's planned.

---

## Anti-Features (Don't Build)

Features that waste hackathon time or create scope creep. **Explicitly avoid these.**

| Anti-Feature | Why Avoid | What to Do Instead | Time Saved |
|--------------|-----------|-------------------|------------|
| **20 Levels** | You won't finish. Judges won't play past Level 3. | Build 3-5 tutorial levels. Make last level loop/endless. | 15-20 hours |
| **8+ Spell Types** | Gesture recognition accuracy drops with too many patterns | 3-4 core spells, show "system supports more" in design | 8-12 hours |
| **Complex Enemy AI** | Pathfinding bugs will eat your demo time | Enemies move toward player. Maybe one "ranged" variant. | 6-8 hours |
| **Story/Lore** | Nobody reads text in hackathon demos | 1-sentence tagline: "You're the last wizard defending reality" | 4-6 hours |
| **Multiplayer** | Networking is a hackathon killer | Single-player. Mention "designed for multiplayer expansion" if asked. | 12-16 hours |
| **Mobile Responsiveness** | Desktop-only is fine for demo | Demo on laptop. Acknowledge "mobile next step" in pitch. | 5-7 hours |
| **Procedural Level Gen** | Handcraft 3 levels faster than debugging RNG | Static levels with clear progression curve | 8-10 hours |
| **Custom Particle System** | Use a library (particles.js, PIXI particles) | Pre-built particle library + tweaked params | 6-8 hours |
| **Save System** | Unnecessary for 3-minute demo | Session-based progress. Restart is acceptable. | 3-4 hours |

**The 48-hour hackathon trap:** Ambitious scope sounds impressive in planning, feels possible at Hour 0, becomes a nightmare at Hour 36. **Cut features preemptively, not desperately.**

**Research finding:** Winning hackathon projects have "one fully functional feature beating five half-baked ones." Your one feature should be **trajectory-based gesture spell casting**.

---

## Hackathon Demo Strategy

What to show in a 3-minute pitch, in what order, and what to skip.

### Demo Script (Practice 5+ Times)

**0:00-0:30 — The Hook**
- "I'm going to cast a fireball using hand gestures on a web browser."
- Draw triangle → fireball appears → trace path → fireball follows path → enemy explodes
- **Why this works:** Judges see the core innovation in 30 seconds. Everything after reinforces.

**0:30-1:00 — Core Loop**
- Show 2-3 spell types (circle for magic missile, zigzag for shield)
- Demonstrate mana tier difference: "Same gesture, different mana tier, different power"
- Kill 3-4 enemies in quick succession with screen shake + particles

**1:00-1:30 — Strategic Depth**
- "Notice the mana bar—I can spam weak spells or save for ultimates"
- Trigger ultimate spell (meteor storm or similar)
- Show tutorial system: "Players learn one mechanic per level"

**1:30-2:00 — Technical Achievement**
- "Built in 48 hours using vanilla JavaScript and canvas"
- Mention gesture recognition library (Jager, ~0.2ms recognition time)
- Show gesture recognition overlay (draw triangle → highlight recognized shape)

**2:00-2:30 — Vision/Questions**
- "Designed for expansion: 5 enemy types, 20 levels, upgrade system in design doc"
- "Gesture-based input works on mobile, VR, accessibility devices"
- Open for questions

**2:30-3:00 — Buffer/Contingency**
- If demo breaks, have backup recording
- If judges want to try, have second browser window ready

### What to Show

✅ **MUST DEMONSTRATE:**
- Gesture drawing → instant recognition → spell fires
- Trajectory aiming (your differentiator)
- Enemy taking damage and dying
- Screen shake + particle effects
- Tutorial overlay (even if just Level 1)

✅ **SHOULD DEMONSTRATE (if polished):**
- 3-tier mana system with visual indicator
- 2-3 different spell types
- Wave progression (enemies get harder)

❌ **DON'T DEMONSTRATE:**
- Features that aren't working perfectly
- Long explanations of planned features
- Reading through design document
- Apologizing for missing features

### Demo Environment Setup

**Preparation checklist (night before):**
- [ ] Demo runs on 2 separate machines (backup)
- [ ] Browser cache cleared (fresh load)
- [ ] Video recording of perfect run (if live demo fails)
- [ ] Gesture recognition calibrated for demo screen
- [ ] Audio levels tested in demo room
- [ ] Restart browser between practice runs (test cold start)

**Failure contingencies:**
- Gesture not recognizing? Have backup keyboard controls
- Browser crash? Switch to backup laptop (5-second switch)
- Sound not working? Narrate the effects ("and here you'd hear the explosion")

**Research finding:** "Practice your demo at least 5 times" and "identify where things could break and have contingencies ready."

---

## Feature Dependencies

Build order based on technical and gameplay dependencies.

```
PHASE 1: Core Loop (Hours 0-12)
├─ Canvas rendering system
├─ Gesture recognition integration (Jager/$1)
│  └─ 3 basic shapes (circle, triangle, line)
├─ Particle system (library integration)
└─ Basic projectile physics

PHASE 2: Gameplay (Hours 12-24)
├─ Enemy entity (depends on: rendering)
│  ├─ Pathfinding (move toward player)
│  ├─ Health system
│  └─ Death animation
├─ Collision detection (depends on: projectiles + enemies)
└─ Wave system (spawn timing)

PHASE 3: Differentiators (Hours 24-36)
├─ Trajectory aiming (depends on: gesture recognition)
├─ Screen shake + juice (depends on: collision detection)
└─ 3-tier mana system (depends on: spell casting)

PHASE 4: Tutorial & Polish (Hours 36-48)
├─ Tutorial overlays (depends on: core loop)
├─ UI/HUD (mana bar, health, wave counter)
├─ Audio integration
└─ Demo environment testing
```

**Critical path:** Core Loop → Enemy System → Trajectory Aiming → Polish

**Parallel work opportunities (if you get help or work efficiently):**
- Audio can be added anytime (low dependency)
- Particle effects can be refined while enemy AI is being built
- Tutorial text can be written while testing gameplay

**Risk mitigation:**
- If gesture recognition isn't working by Hour 8, switch to keyboard input + gesture animations (fake it for demo)
- If trajectory aiming is too buggy by Hour 30, fall back to fixed-direction spells
- If tutorial system isn't done by Hour 42, add text overlays instead of interactive tutorial

---

## Competitive Analysis

Similar games/projects and what they do well.

### Magic Touch: Wizard for Hire (Nitrome, 2015)
**What it does well:**
- Simple gesture matching: draw shape on balloon → balloon pops
- Immediate feedback (balloon pop + knight falls)
- Combo system (pop multiple matching shapes = bonus)
- Multiple game modes (Classic, Insane, Zen, Time Attack)

**What Aethos does differently:**
- Trajectory aiming (Magic Touch has no aim component)
- Mana tiers (Magic Touch has no resource management)
- Wave progression (Magic Touch is endless defense)

**Lesson for hackathon:** Magic Touch proves simple gesture → instant reward works. Don't overcomplicate.

### The Wizards: Enhanced Edition (VR, 2017)
**What it does well:**
- Natural hand movements = spells (draw circle → fireball)
- Spatial awareness (dodge while casting)
- 6 gesture-based spells with clear differentiation

**What Aethos does differently:**
- Web-based (no VR hardware barrier)
- Draw-to-aim mechanic
- Strategic resource management

**Lesson for hackathon:** VR gesture games prioritize physicality. Web games need visual clarity—make gestures obvious on 2D screen.

### Fictorum (PC, 2017)
**What it does well:**
- Spell customization on the fly (modify area, damage, cooldown)
- Destructible environments (visual impact)
- Procedurally generated spells

**What Aethos does differently:**
- Gesture input (Fictorum uses keyboard)
- Real-time drawing (Fictorum uses menus)

**Lesson for hackathon:** "Spell customization" can be simplified to "same gesture, different mana tier" and achieve similar strategic depth.

### Spellcasters Chronicles (2025, Early Access)
**What it does well:**
- 3rd-person action-strategy hybrid
- Summoning creatures + casting spells
- Free-to-play with planned spell unlocks

**What Aethos does differently:**
- Gesture-based casting (Spellcasters uses hotkeys)
- Solo defense (Spellcasters is team-based)

**Lesson for hackathon:** Modern spell games balance offense (projectiles) and defense (shields). Include at least one defensive gesture.

### Key Takeaways from Competitive Analysis

| Game Element | Industry Standard | Aethos Innovation |
|--------------|-------------------|-------------------|
| **Input** | Hotkeys, mouse clicks | Gesture drawing |
| **Aiming** | Mouse cursor | Draw trajectory |
| **Resources** | Cooldowns or mana pool | 3-tier mana (free/utility/ultimate) |
| **Progression** | Unlock new spells | Same gesture, scaled by mana tier |
| **Feedback** | Particles + sound | Particles + sound + screen shake |

**Competitive positioning for pitch:** "Gesture-based spell casting has been done in VR (The Wizards) and mobile (Magic Touch), but **trajectory-based aiming on web canvas is novel**. We're bringing the physicality of gesture recognition to accessible web gaming with strategic depth through mana tiers."

---

## Technical Feasibility Notes

Based on research into JavaScript gesture recognition libraries and hackathon game development timelines.

### Gesture Recognition (HIGH confidence)
- **Libraries available:** Jager (0.2ms recognition), $1 Recognizer (100 lines of code, 16 shapes)
- **Recommendation:** Use Jager for speed or $1 for simplicity. Both hackathon-proven.
- **Implementation time:** 4-6 hours (integration + calibration)
- **Risk:** LOW (well-documented, multiple fallback options)

### Trajectory Aiming (MEDIUM-HIGH confidence)
- **Approach:** Store gesture points after recognition, render as bezier curve, convert to projectile path
- **Canvas API support:** Native bezier curves, path rendering
- **Implementation time:** 6-8 hours (gesture extension + physics)
- **Risk:** MEDIUM (novel feature, may need iteration for feel)

### Particle Systems (HIGH confidence)
- **Libraries available:** particles.js, PIXI.js particles, matter.js
- **Recommendation:** Use pre-built library, customize parameters
- **Implementation time:** 2-3 hours (integration + tweaking)
- **Risk:** LOW (drop-in libraries exist)

### 3-Tier Mana System (HIGH confidence)
- **Approach:** Single mana pool, spells check threshold (0-33% = free, 34-66% = utility, 67-100% = ultimate)
- **UI:** Color-coded bar (green/yellow/red sections)
- **Implementation time:** 4-5 hours (logic + UI)
- **Risk:** LOW (straightforward state management)

### Tutorial System (HIGH confidence)
- **Approach:** State machine (Level 1 = draw circle, Level 2 = aim, Level 3 = kill enemies)
- **Implementation:** Canvas overlays + text prompts
- **Implementation time:** 4-5 hours (3 levels)
- **Risk:** LOW (linear progression, no branching)

### Audio (HIGH confidence)
- **Web Audio API:** Well-supported, simple for sound effects
- **Assets:** freesound.org, OpenGameArt.org (CC0 licensed)
- **Implementation time:** 2-3 hours (integration + asset search)
- **Risk:** LOW (audio is "nice-to-have," can be added last)

**Overall technical feasibility: HIGH.** All core features have proven implementations in JavaScript. Trajectory aiming is the only "research spike" but has clear fallback (fixed-direction spells).

---

## Sources

Research conducted February 6, 2026, using current web sources and authoritative documentation.

### Gesture Recognition & Game Mechanics
- [Best Gesture Recognition Libraries in JavaScript 2025](https://portalzine.de/best-gesture-recognition-libraries-in-javascript-2025/)
- [$1 Gesture Recognizer Official Page](https://depts.washington.edu/acelab/proj/dollar/index.html)
- [Spellbound VR Gesture Casting](https://www.roadtovr.com/spellbound-lets-you-cast-virtual-magic-with-your-real-hands/)
- [Conjuring a Gestural Spellcasting System for VR](https://www.gamedeveloper.com/design/conjuring-a-gestural-spellcasting-system-for-vr)
- [Magic Touch: Wizard for Hire on App Store](https://apps.apple.com/us/app/magic-touch-wizard-for-hire/id946917251)

### Hackathon Demo Best Practices
- [10 Winning Hacks: What Makes a Hackathon Project Stand Out](https://medium.com/@BizthonOfficial/10-winning-hacks-what-makes-a-hackathon-project-stand-out-818d72425c78)
- [Surviving a Game Hackathon Like the 48-Hour Global Game Jam](https://medium.com/revelry-labs/surviving-a-game-hackathon-like-the-48-hour-global-game-jam-1a2e2e696179)
- [Game Hackathon Guide: Everything You Need to Know](https://corporate.hackathon.com/articles/game-hackathon-guide-everything-you-need-to-know)

### Game Design Patterns
- [Systems of Magic - Part 1](https://www.gamedeveloper.com/design/systems-of-magic---part-1)
- [Video Games Deserve Better Magic Systems](https://calenbender.medium.com/video-games-deserve-better-magic-systems-0bba8ef418d6)
- [Game UX: Best Practices for Video Game Tutorial Design](https://inworld.ai/blog/game-ux-best-practices-for-video-game-tutorial-design)
- [Game UX: Best Practices for Video Game Onboarding 2024](https://inworld.ai/blog/game-ux-best-practices-for-video-game-onboarding)

### Game Polish & Juice
- [Juice in Game Design: Making Your Games Feel Amazing](https://www.bloodmooninteractive.com/articles/juice.html)
- [How To Improve Game Feel In Three Easy Ways](https://gamedevacademy.org/game-feel-tutorial/)
- [Game Particle Effects: Complete VFX Programming Guide 2025](https://generalistprogrammer.com/tutorials/game-particle-effects-complete-vfx-programming-guide-2025)

### Enemy AI & Progression
- [The Art of Difficulty Curve](https://www.numberanalytics.com/blog/the-art-of-difficulty-curve)
- [Enemy Design and Enemy AI for Melee Combat Systems](https://www.gamedeveloper.com/design/enemy-design-and-enemy-ai-for-melee-combat-systems)

**Confidence Assessment:** Research based on current industry practices (2024-2025 sources), established game design patterns, and verified technical libraries. Hackathon recommendations based on actual winning projects and game jam post-mortems.
