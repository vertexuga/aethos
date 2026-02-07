# AETHOS: Fragments of the Void

## What This Is

A gesture-based spell casting web game where players draw shapes on screen to cast spells, then continue drawing to aim the spell's trajectory. Inspired by Google's Halloween Magic Cat game, it combines real-time shape recognition with strategic mana management across 20+ levels and an endless mode. Built as a solo hackathon project for UGAHacks11.

## Core Value

Drawing shapes to cast spells must feel magical — the gesture recognition, visual feedback, and spell effects are the experience. If the drawing-to-casting loop doesn't feel responsive and satisfying, nothing else matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Gesture-based spell casting with shape recognition (circle, triangle, swipe, zigzag, spiral, circle-dot, horizontal swipe hold, star+circles)
- [ ] Trajectory extraction from continued drawing after shape recognition
- [ ] Three-tier spell system: Free elemental attacks (0 mana), Utility spells (35 mana), Ultimate (100 mana)
- [ ] Accuracy scaling — sloppy draws deal reduced damage
- [ ] Mana resource system with visual thresholds at 35 and 100, passive regen + kill bonuses
- [ ] 7 spell types: Quick Shot, Magic Missile, Fireball, Shield, Life Drain, Time Slow, Dash, plus Meteor Storm ultimate
- [ ] 5 enemy types: Slimes, Turrets, Fast Zombies, Bosses, Environmental Hazards
- [ ] Enemy visual language with color coding and attack warnings
- [ ] 20 structured levels with tutorial progression (new mechanics introduced gradually)
- [ ] Endless mode unlocked after Level 20
- [ ] Spell loadout selection (pick 2 utilities before each level)
- [ ] Upgrade system between levels (mana, spell efficiency, spell power, ultimate)
- [ ] HUD with HP bar, mana bar with thresholds, spell bar, accuracy feedback
- [ ] Post-level stats screen with rank, accuracy, spell usage breakdown
- [ ] Difficulty scaling (Easy/Normal/Hard affecting mana costs and regen)
- [ ] On-screen warnings for utility triggers (Levels 1-15, then fade)
- [ ] Environmental hazards: lava, safe zones, poison clouds, falling debris
- [ ] Visual effects: spell trajectories, drawing trails, screen shake, particles
- [ ] Main menu (existing), Archives, Sigils, Settings screens
- [ ] Accessibility: colorblind modes, adjustable UI scale, practice mode

### Out of Scope

- Multiplayer/online features — solo game, hackathon timeline
- Mobile native app — web browser only
- Monetization system — hackathon demo, no payments
- Sound/music — visual-first for hackathon demo (add if time permits)
- Backend/server — fully client-side game
- User accounts/save system — local storage at most

## Context

- **Hackathon:** UGAHacks11, 24-48 hour timeline, solo developer
- **Existing code:** React main menu screen with particle canvas, custom cursor, dark mystical aesthetic (Cinzel Decorative + Cormorant Garamond fonts, teal/gold/navy palette)
- **Tech stack decided:** React + HTML5 Canvas for game rendering, TensorFlow.js for ML shape recognition (with $1 Recognizer as fallback/starting point), Tailwind CSS for UI, React Router for navigation
- **Design doc:** Comprehensive game design document covering all mechanics, balance numbers, tutorial flow, enemy design, UI layouts, and progression systems
- **Inspiration:** Google Halloween Magic Cat Game, Slay the Spire (UI clarity), Genshin Impact (spell effects), Vampire Survivors (wave combat), Hades (fast-paced combat)
- **Art direction:** Dark, mystical, slightly whimsical. Readability over realism. Spell color coding: blue/cyan (free), purple/magenta (utility), gold/orange/red (ultimate)

## Constraints

- **Timeline**: 24-48 hours hackathon — must prioritize core loop and impressive demo moments
- **Team**: Solo developer — Claude builds, user directs
- **Platform**: Web browser only, target 60 FPS
- **Performance**: ML recognition offloaded to web worker, particle system pooling
- **Stack**: React, Canvas, TensorFlow.js/$1 Recognizer, Tailwind CSS — already committed
- **Existing UI**: Must integrate with established visual identity (dark theme, teal/gold/navy colors, Cinzel Decorative font)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web browser game (not mobile native) | Hackathon demo needs to run anywhere, React already started | — Pending |
| Start with $1 Recognizer, upgrade to TensorFlow.js | $1 is simpler to implement quickly, ML can layer on top | — Pending |
| React + Canvas hybrid (React for UI, Canvas for game) | Leverages existing React menu, Canvas for 60fps game rendering | — Pending |
| All utility spells cost 35 mana (flat) | Simplifies player decision-making — tactical not mathematical | — Pending |
| Tutorial introduces one mechanic per level | Prevents overwhelm, teaches through play not text | — Pending |
| Full feature set attempted | Hackathon ambition — build as much as possible with AI assistance | — Pending |

---
*Last updated: 2026-02-06 after initialization*
