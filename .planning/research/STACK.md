# Stack Research: Gesture-Based Spell Casting Web Game

**Project:** AETHOS: Fragments of the Void
**Researched:** 2026-02-06
**Context:** 24-48 hour hackathon, solo developer, React/Tailwind UI already exists

## Executive Summary

For a gesture-based web game in a hackathon setting, the 2026 standard stack prioritizes **speed of implementation over architectural purity**. The recommended approach: **Vite + React 19 + Vanilla Canvas 2D + $1 Recognizer + Zustand + Tailwind CSS 4**. Skip heavy game frameworks (Phaser, PixiJS) that add learning curve. Skip TensorFlow.js for initial implementation—it's overkill for simple shape recognition and adds 12MB + complexity. Start with $1 Recognizer (100 lines of code, fast to implement), which handles circle/triangle/line/zigzag/spiral perfectly for spell casting gestures.

**Key insight from 2026 ecosystem:** Vanilla Canvas 2D at 60fps is achievable and simpler than WebGL frameworks for 2D games. React for UI + Canvas for game rendering is the proven pattern. Vite 6 is the new standard (CRA officially sunset in Feb 2025).

## Recommended Stack

### Core Framework & Build Tool

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **React** | 19.2+ | UI layer, routing, component structure | Already in use. React 19.2 adds `useActionState`, `useOptimistic`, React Compiler (auto-memoization). Perfect for menu/HUD/overlays while Canvas handles game loop. | **HIGH** |
| **Vite** | 6.0+ | Build tool, dev server, HMR | CRA officially sunset Feb 2025. Vite 6 delivers 5x faster full builds, 100x faster incremental builds (microseconds). Hackathon-critical: sub-second hot reload. Environment API for modern workflows. | **HIGH** |
| **Tailwind CSS** | 4.0+ | UI styling | Already in use. V4 delivers 5x faster builds, zero config, CSS-first with `@theme` directive. Setup: one line (`@import "tailwindcss"`). | **HIGH** |

**Sources:**
- [React 19.2 release notes](https://react.dev/blog/2025/10/01/react-19-2) (useEffectEvent, Activity API)
- [Vite 6.0 announcement](https://vite.dev/blog/announcing-vite6) (performance benchmarks)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) (Oxide engine, zero config)
- [CRA sunset announcement](https://dev.to/solitrix02/goodbye-cra-hello-vite-a-developers-2026-survival-guide-for-migration-2a9f)

### Game Rendering

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Vanilla HTML5 Canvas 2D** | Native | Game rendering, particle effects, spell animations | **Best for hackathons.** No framework learning curve. Direct control. 60fps achievable with 200-300 particles on desktop, 50-80 on mobile. WebGL overkill for 2D. React `useRef` + `requestAnimationFrame` pattern is well-documented. | **HIGH** |

**Why NOT Phaser or PixiJS:**
- **Phaser:** Full game framework (~12MB bundle). Built-in physics, tilemap, particle system sounds great but adds complexity. You'd spend hours learning Phaser's architecture instead of building YOUR game. Hackathon anti-pattern.
- **PixiJS:** WebGL rendering library (smaller than Phaser). Fastest rendering BUT: (1) adds learning curve for DisplayObjects/Sprites/Containers, (2) WebGL provides minimal benefit for simple 2D shapes/particles, (3) Canvas 2D is more debuggable. PixiJS excels at complex sprites/animations—you're drawing circles and lines.

**Performance data (2026):**
- Canvas 2D handles 200-300 particles at 60fps (desktop), 50-80 (mobile)
- Optimization: Keep `ctx.fillStyle` constant, vary `ctx.globalAlpha` (25x faster than changing colors)
- Particles <1px render as squares not circles (183% faster)

**Sources:**
- [Canvas performance benchmarks](https://www.cssscript.com/best-particles-animation/) (particle limits, optimization techniques)
- [PixiJS vs Phaser comparison](https://dev.to/ritza/phaser-vs-pixijs-for-making-2d-games-2j8c) (bundle sizes, use cases)
- [React + Canvas best practices 2026](https://jslegenddev.substack.com/p/why-use-react-for-game-development)
- [JS rendering benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark) (PixiJS fastest, but Canvas 2D sufficient for 2D)

### Gesture Recognition

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **$1 Recognizer** | N/A (algorithm) | Shape/gesture recognition (circle, triangle, line, zigzag, spiral) | **HACKATHON WINNER.** ~100 lines of code. 2-D Euclidean template matcher. Recognizes drawn gestures with high accuracy using few templates. Won UIST 2024 Lasting Impact Award (17 years after publication). Fast, simple, proven. Start here. | **HIGH** |
| **JavaScript Implementation** | Custom or `shape-detector` package | Implementing $1 algorithm | `shape-detector` on npm is refactored $1 without Protractor. Or copy reference implementation from [UW research site](https://depts.washington.edu/acelab/proj/dollar/index.html). Custom templates for your spell shapes. | **MEDIUM** |

**Why NOT TensorFlow.js (initially):**
- **TF.js for hand tracking:** Handpose model is 12MB, runs at 30fps. You don't need hand tracking—you're tracking mouse/touch input drawing shapes.
- **TF.js for custom shape ML:** Requires training dataset, model architecture, training pipeline. Hackathon timeline killer.
- **$1 Recognizer does the job:** Circle, triangle, zigzag, spiral, star—all recognizable with geometric templates. Save ML for V2 if you have time.

**If you have extra time, consider:**
- **MediaPipe Gesture Recognizer** (camera-based hand gestures): Overkill for mouse drawing, but if you want "cast spells by waving hands at webcam," it's `npm install @mediapipe/tasks-vision@0.10.22-rc` with 8 built-in gestures. Cool demo factor but adds complexity.

**Sources:**
- [$1 Recognizer research](https://depts.washington.edu/acelab/proj/dollar/index.html) (original algorithm, won UIST 2024 Lasting Impact Award)
- [shape-detector npm](https://github.com/MathieuLoutre/shape-detector) (JavaScript implementation)
- [MediaPipe Gesture Recognizer](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js) (camera-based alternative)
- [TensorFlow.js Handpose](https://blog.tensorflow.org/2021/11/3D-handpose.html) (12MB, 30fps)

### State Management

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Zustand** | 5.0.11+ | Game state (HP, mana, score, spell loadout, level progress) | Lightweight (sub-10KB gzipped), no providers, no boilerplate. 30% YOY growth, in 40% of projects (2026). Perfect for game state: `useStore((state) => state.mana)` in React components, direct updates in Canvas game loop. Performance: bypasses Context API re-render issues. | **HIGH** |
| **React Context API** | Native | Theme, settings, stable config only | Built-in. Use for dependency injection (colorblind mode, difficulty, UI scale). NOT for reactive game state (causes unnecessary re-renders). | **HIGH** |

**Why NOT Redux:**
- Redux Toolkit is powerful but adds boilerplate (slices, reducers, actions). Zustand does the same job in fewer lines. Hackathon = minimize code.

**Sources:**
- [Zustand vs Redux vs Context 2026](https://medium.com/@sparklewebhelp/redux-vs-zustand-vs-context-api-in-2026-7f90a2dc3439) (growth stats, performance)
- [React state management 2026](https://dev.to/cristiansifuentes/react-state-management-in-2025-context-api-vs-zustand-385m) (when to use each)
- [State management patterns](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) (TanStack for server, Zustand for client)

### Particle Effects

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Custom Canvas Implementation** | N/A | Spell effects, drawing trails, screen shake | **Hackathon approach:** Roll your own. Object pooling for particles, `requestAnimationFrame` loop. Full control, no library. Tutorials abundant. | **HIGH** |
| **tsParticles** (optional) | 3.0+ | Menu background, confetti effects (non-gameplay) | If already using for menu background (PROJECT.md mentions particle canvas), keep it for UI. Don't use in game loop (adds dependency). React wrapper: `react-tsparticles`. | **MEDIUM** |

**Particle implementation notes:**
- Pool particles (reuse objects, don't create/destroy per frame)
- Limit: 200-300 desktop, 50-80 mobile
- Optimize: constant `fillStyle`, vary `globalAlpha`
- Small particles (<1px) as squares not circles

**Sources:**
- [tsParticles GitHub](https://github.com/tsparticles/tsparticles) (React integration, confetti)
- [Canvas particle performance](https://www.cssscript.com/best-particles-animation/) (benchmarks, optimization)
- [Sparticles performance guide](https://github.com/simeydotme/sparticles) (fast, lightweight Canvas particles)

### Routing & Navigation

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **React Router** | 6.x | Navigation (Main Menu → Game → Archives → Settings) | Already in PROJECT.md tech stack. Standard for React SPAs. V6 uses hooks (`useNavigate`), simpler than V5. | **HIGH** |

**Sources:**
- PROJECT.md mentions React Router in tech stack

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **clsx** | Latest | Conditional CSS class names | Tailwind utilities with dynamic classes (`clsx('btn', isActive && 'btn-active')`). Tiny (228B). | **HIGH** |
| **react-howler** | Latest (optional) | Sound effects (if time permits) | Wrapper for Howler.js (Web Audio API). Easy sound sprite management. PROJECT.md marks sound as "add if time permits." | **LOW** |

## Installation Commands

```bash
# Create Vite + React project (if not already done)
npm create vite@latest aethos -- --template react

# Core dependencies
npm install react@19 react-dom@19 react-router-dom@6 zustand@5

# Tailwind CSS 4 (CSS-first setup)
npm install tailwindcss@4 -D

# Utilities
npm install clsx

# Optional: Particles for menu background
npm install react-tsparticles tsparticles

# Optional: Sound (if time permits)
npm install react-howler

# Dev dependencies (Vite handles most build tools)
npm install -D @vitejs/plugin-react
```

**Tailwind 4 setup (CSS-first):**
```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-bg-dark: #0a0a12;
  --color-bg-navy: #1a1a2e;
  --color-accent-blue: #7eb8da;
  --color-accent-gold: #f4e8c1;
  --color-accent-teal: #4a8f8f;
}
```

No `tailwind.config.js` needed—Tailwind 4 auto-detects content.

## Architecture Pattern: React UI + Canvas Game Loop

**The 2026 standard pattern for React + Canvas games:**

```javascript
// GameCanvas.jsx
import { useEffect, useRef } from 'react';
import { useStore } from './store'; // Zustand

function GameCanvas() {
  const canvasRef = useRef(null);
  const { mana, hp, updateMana } = useStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    // Game loop
    function gameLoop() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render game (particles, spells, enemies)
      renderGame(ctx);

      // Continue loop
      animationId = requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative">
      {/* Canvas for game rendering */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="block"
      />

      {/* React overlay for HUD */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="p-4">
          <div className="bg-navy/80 p-2 rounded">
            HP: {hp} | Mana: {mana}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Key principles:**
1. **Canvas handles game rendering** (60fps loop, no React re-renders)
2. **React handles UI overlays** (HUD, menus, settings)
3. **Zustand bridges the two** (Canvas reads/writes store, React components subscribe)
4. **No state in Canvas loop** (pure rendering, state in Zustand)

**Sources:**
- [React Canvas pattern](https://medium.com/@pdx.lucasm/canvas-with-react-js-32e133c05258) (useRef + useEffect)
- [React for game UI](https://jslegenddev.substack.com/p/why-use-react-for-game-development) (overlay pattern)

## What NOT to Use

### ❌ Create React App (CRA)
**Why:** Officially sunset February 2025. Slow builds (30+ seconds), no ES modules, deprecated. React team no longer recommends it.
**Instead:** Vite 6 (5x faster builds, sub-second HMR).

**Source:** [CRA sunset guide](https://dev.to/solitrix02/goodbye-cra-hello-vite-a-developers-2026-survival-guide-for-migration-2a9f)

### ❌ Phaser / PixiJS / Babylon.js
**Why:** Learning curve kills hackathon velocity. Phaser is 12MB, comes with tilemap/physics you don't need. PixiJS requires learning DisplayObject model for minimal benefit (your game is simple 2D shapes). These shine for complex sprite-based games or 3D—not gesture-based spell casting.
**Instead:** Vanilla Canvas 2D. Direct control, no abstractions, 60fps achievable.

**Source:** [Phaser vs PixiJS](https://dev.to/ritza/phaser-vs-pixijs-for-making-2d-games-2j8c), [Rendering benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)

### ❌ TensorFlow.js (for initial implementation)
**Why:** Overkill for shape recognition. 12MB bundle. Requires training pipeline for custom shapes OR using pre-trained models (Handpose) that don't match your use case (you're tracking mouse, not hands). $1 Recognizer does circle/triangle/zigzag in 100 lines.
**Instead:** $1 Recognizer. Add TensorFlow.js in V2 if you want ML polish.

**Source:** [TensorFlow.js Handpose](https://blog.tensorflow.org/2021/11/3D-handpose.html) (12MB, camera-based)

### ❌ Redux / Redux Toolkit
**Why:** More boilerplate than Zustand for same result. Slices, reducers, actions—unnecessary ceremony for hackathon.
**Instead:** Zustand (5 lines to create store vs 20+ for Redux).

**Source:** [Redux vs Zustand 2026](https://medium.com/@sparklewebhelp/redux-vs-zustand-vs-context-api-in-2026-7f90a2dc3439)

### ❌ Next.js / Server-Side Rendering
**Why:** Your game is 100% client-side. No server data fetching. SSR adds complexity (app router, server components) you won't use. Vite + React Router is simpler.
**Instead:** Vite SPA.

### ❌ TypeScript (controversial but hear me out)
**Why (hackathon context):** You're solo, 24-48 hours, prototyping rapidly. TS adds: (1) type definitions for Canvas APIs, (2) slower iteration (fix types vs ship features), (3) build complexity. JavaScript's flexibility speeds up experimentation.
**Counterpoint:** If you're already fluent in TS, keep it. Don't add it mid-hackathon.
**Instead:** JavaScript. Add TS post-hackathon if converting to production.

**Note:** This is hackathon-specific advice. For production, TypeScript is highly recommended.

## Hackathon-Specific Notes

### Speed vs Quality Tradeoffs (24-48 hour timeline)

**PRIORITY 1: Core Loop (8-12 hours)**
- Canvas setup + game loop (requestAnimationFrame)
- Mouse/touch input tracking
- $1 Recognizer integration (circle, triangle, line)
- Basic spell casting (draw shape → recognize → spawn projectile)
- Enemy spawning + collision detection
- HP/mana bars (React overlay on Canvas)

**PRIORITY 2: Game Feel (4-8 hours)**
- Particle effects (drawing trail, spell impact)
- Screen shake on hit
- Visual feedback on shape recognition (glow, confirm)
- Mana system (cost/regen)
- Enemy variety (2-3 types: slime, turret, fast zombie)

**PRIORITY 3: Progression (4-6 hours)**
- Level structure (5-10 levels for demo, not full 20)
- Tutorial prompts (text overlays)
- Upgrade screen (between levels, pick 1-2 stats)
- Victory/death screens

**PRIORITY 4: Polish (if time remains)**
- More spell types (3-4 core + 1 ultimate)
- More enemy types
- Settings screen (difficulty, colorblind mode)
- Sound effects (React Howler)
- Particle variety

**CUT if needed:**
- Endless mode (can add post-hackathon)
- Full 20 levels (ship 5-10, expandable)
- Stats screen with accuracy breakdown (just show score)
- Environmental hazards (lava, poison clouds)
- Archives/Sigils screens (lore can be text files)

### Implementation Speed Tips

**$1 Recognizer:**
- Start with 3 shapes: circle (fireball), line (quick shot), triangle (shield)
- Add more if time permits
- Templates can be hand-drawn and recorded (draw shape, save points, use as template)

**Canvas Performance:**
- Use object pooling from the start (particles, projectiles)
- Set max particle count (200) and enforce limit
- Draw order: background → enemies → projectiles → particles → HUD overlay

**State Management:**
- Keep game state flat in Zustand (no nested objects to start)
- Example: `{ hp: 100, mana: 50, score: 0, enemies: [], projectiles: [] }`
- Zustand updates don't re-render Canvas (only subscribed React components)

**React + Canvas Bridge:**
- Canvas reads Zustand state directly (no subscriptions in loop)
- Canvas writes to Zustand on events (enemy killed, mana used)
- React HUD subscribes to relevant slices only (`useStore(s => s.hp)`)

**Testing:**
- Manual testing only (no Jest/Vitest in hackathon)
- Console.log for debugging
- Chrome DevTools Performance tab if frame drops

### Version Strategy

**Use latest stable, not bleeding edge:**
- React 19.2 (stable, not RC)
- Vite 6.0 (stable as of Nov 2024)
- Tailwind 4.0 (stable as of March 2024)
- Zustand 5.0.11 (stable)

**Why:** Hackathons don't have time for alpha/beta bugs. Stick to GA releases with documentation.

### Dependency Minimalism

**Core stack only 6 packages:**
1. `react` + `react-dom`
2. `react-router-dom`
3. `zustand`
4. `tailwindcss`
5. `clsx`
6. `vite` (dev dep)

**Every additional package = risk:**
- Installation time
- Bundle size
- Breaking changes
- Learning curve

**Evaluate:** "Does this save me more time than implementing myself?" If yes, add. If no, skip.

### Performance Budget (60fps = 16.67ms per frame)

**Frame budget breakdown:**
- Input processing: 1-2ms (mouse tracking, gesture recognition)
- Game logic: 3-5ms (collision, AI, spawning)
- Rendering: 8-10ms (Canvas draw calls)
- Overhead: 2-3ms (browser, GC)

**If frame drops (<60fps):**
1. Reduce particle count
2. Simplify enemy AI (update every N frames)
3. Batch Canvas draw calls (one fillStyle, multiple rects)
4. Profile in Chrome DevTools

### Demo Strategy (Judges see 2-5 minutes)

**What judges need to see:**
1. **Core mechanic clarity:** Draw shape, spell fires (10 seconds)
2. **Game feel:** Particles, screen shake, satisfying hits (30 seconds)
3. **Progression:** Win level 1, upgrade stat, start level 2 (60 seconds)
4. **Visual polish:** Dark aesthetic, glowing effects, HUD readability (throughout)

**Front-load the good stuff:**
- Tutorial level should wow them (particles, smooth recognition, instant feedback)
- Don't make judges hunt for cool features
- Have a "demo mode" button that skips to impressive level

**What judges won't see (deprioritize):**
- Level 20 content
- Endless mode
- Settings menu
- Archive/lore screens

**Practice demo run:** 2 minutes, live gameplay, narrate mechanics.

## Confidence Assessment

| Area | Confidence | Reasoning |
|------|------------|-----------|
| **Vite + React 19** | HIGH | CRA sunset makes Vite the clear choice. React 19 stable, widely adopted. Existing codebase uses React. |
| **Vanilla Canvas 2D** | HIGH | Proven for 2D games at 60fps. No learning curve. Extensive tutorials. Simpler than Phaser/PixiJS for this use case. |
| **$1 Recognizer** | HIGH | Algorithm proven (UIST 2024 award), simple implementation (100 lines), handles target shapes (circle/triangle/zigzag). |
| **Zustand** | HIGH | Mature (5.0), widely adopted (40% projects 2026), perfect for game state. Faster than Context, simpler than Redux. |
| **Tailwind 4** | HIGH | Already in use, V4 delivers performance gains, zero-config setup. |
| **Performance (60fps)** | MEDIUM | Achievable with optimization (pooling, particle limits) but requires testing. Mobile performance unknown. |
| **Hackathon Timeline** | MEDIUM | Ambitious feature set (PROJECT.md lists 20 levels, 8 spells, 5 enemy types). Core loop achievable in 48h, full scope questionable. |

## Sources

All sources embedded inline above. Key references:
- [React 19.2 release](https://react.dev/blog/2025/10/01/react-19-2)
- [Vite 6.0 announcement](https://vite.dev/blog/announcing-vite6)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [Zustand npm](https://www.npmjs.com/package/zustand)
- [$1 Recognizer research](https://depts.washington.edu/acelab/proj/dollar/index.html)
- [Canvas performance guide](https://www.cssscript.com/best-particles-animation/)
- [React + Canvas patterns](https://jslegenddev.substack.com/p/why-use-react-for-game-development)
- [State management comparison 2026](https://medium.com/@sparklewebhelp/redux-vs-zustand-vs-context-api-in-2026-7f90a2dc3439)

---

**RECOMMENDATION FOR ROADMAP CREATION:**

This stack prioritizes **velocity and simplicity**. Phase structure should be:

1. **Foundation** (Vite setup, Canvas boilerplate, $1 Recognizer integration)
2. **Core Loop** (Drawing → Recognition → Spell Casting → Hit Detection)
3. **Game Feel** (Particles, trails, screen shake, mana system)
4. **Progression** (Levels, enemies, upgrades)
5. **Polish** (More spells, UI refinement, sound if time permits)

**Critical path:** Get drawing → spell casting → enemy hit working in first 8 hours. Everything else builds on that foundation.
