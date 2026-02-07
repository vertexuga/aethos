# Pitfalls Research: Gesture-Based Web Game (Hackathon)

**Project:** AETHOS: Fragments of the Void
**Context:** Solo hackathon (24-48 hours), React + Canvas gesture recognition game
**Researched:** 2026-02-06
**Confidence:** HIGH (verified with multiple authoritative sources)

---

## Critical Pitfalls (Will Kill the Demo)

### Pitfall 1: Display Refresh Rate Dependency
**What goes wrong:** Game physics tied to frame rate causes wildly different gameplay on different monitors. A player on 120Hz display moves/fires twice as fast as 60Hz player.

**Why it happens:** Using `requestAnimationFrame` without delta time—assuming consistent frame intervals.

**Consequences:** Demo fails spectacularly if judge's laptop has different refresh rate than your dev machine. Spell casting speed becomes unpredictable.

**Prevention:**
```javascript
// BAD: Frame-dependent
function gameLoop() {
  player.x += 5; // moves 300px/sec on 60Hz, 600px/sec on 120Hz
}

// GOOD: Time-dependent
let lastTime = 0;
function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  player.x += 300 * deltaTime; // always 300px/sec
}
```

**Detection:** Test on Chrome with throttled frame rate (Performance tab → CPU throttling).

**Phase:** Core Game Loop (Phase 1) - Must be in foundation.

**Sources:**
- [Standardize your JavaScript games' framerate for different monitors](https://chriscourses.com/blog/standardize-your-javascript-games-framerate-for-different-monitors)
- [Performant Game Loops in JavaScript](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/)

---

### Pitfall 2: React Re-Render Storm Destroying Frame Rate
**What goes wrong:** Every state change (health bar update, mana tick, enemy spawn) triggers full React re-render, re-mounting canvas and killing animation loop. FPS drops from 60 to 15.

**Why it happens:** Canvas ref inside stateful component. React thinks canvas needs to re-render when parent state changes.

**Consequences:** Unplayable lag during spell casting (when particles spawn and state updates simultaneously). Demo becomes slideshow.

**Prevention:**
```javascript
// BAD: Canvas inside stateful component
function Game() {
  const [health, setHealth] = useState(100); // triggers canvas re-mount
  return <canvas ref={canvasRef}>...
}

// GOOD: Isolate canvas from React state
function GameCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    // Animation loop never re-initializes
    const ctx = canvasRef.current.getContext('2d');
    const animate = () => { /* ... */ };
    requestAnimationFrame(animate);
  }, []); // empty deps = runs once
  return <canvas ref={canvasRef} />;
}

function GameUI() {
  const [health, setHealth] = useState(100);
  return <div>{health}</div>; // separate component
}
```

**Detection:** React DevTools Profiler shows canvas re-mounting. FPS drops when health/mana updates.

**Phase:** React-Canvas Integration (Phase 2) - Architecture decision.

**Sources:**
- [React.js Optimization Every React Developer Must Know (2026 Edition)](https://medium.com/@muhammadshakir4152/react-js-optimization-every-react-developer-must-know-2026-edition-e1c098f55ee9)
- [Why Your React App Lags but This Canvas Game Runs at 60FPS](https://dev.to/yzbkaka_dev/why-your-react-app-lags-but-this-canvas-game-runs-at-60fps-2h1d)

---

### Pitfall 3: Demo Fails Because Gestures Don't Work Live
**What goes wrong:** Gesture recognition worked perfectly in dev, but during live demo fails 50% of the time. Judge draws circle, nothing happens. Game is unplayable.

**Why it happens:**
- Lighting in demo room different from dev environment
- Judge's drawing speed different from yours
- Background behind canvas confuses recognition
- Trackpad vs mouse input differences

**Consequences:** Instant hackathon failure. Can't show core mechanic.

**Prevention:**
- **Don't use camera-based recognition** (lighting dependent)
- **Use canvas drawing path** (2D coordinates only)
- **Test in multiple lighting conditions**
- **Test with trackpad + mouse**
- **Generous gesture tolerance** (circle doesn't need perfect roundness)
- **Visual feedback on every stroke** (show drawing trail immediately)
- **Fallback to keyboard shortcuts** for emergency demo recovery

**Detection:** Test on friend's laptop in conference room with fluorescent lights.

**Phase:** Gesture Recognition (Phase 3) - Test in varied conditions.

**Sources:**
- [Hand Gesture Recognition Based on Computer Vision: A Review of Techniques](https://www.mdpi.com/2313-433X/6/8/73)
- [Measuring Responsiveness in Video Games](https://www.gamedeveloper.com/design/measuring-responsiveness-in-video-games)

---

## Performance Pitfalls

### Pitfall 4: Particle System Memory Leak
**What goes wrong:** After 2 minutes of gameplay, memory balloons from 100MB to 2GB. Browser tab crashes mid-demo.

**Why it happens:** Creating new particle objects every frame without cleanup. Garbage collector can't keep up.

**Consequences:** Demo crashes before reaching impressive late-game content. Judges see 1 level, not 20.

**Prevention:**
```javascript
// BAD: Creates objects constantly
function spawnParticle() {
  particles.push({ x: 0, y: 0, vx: Math.random() }); // new object every frame
}

// GOOD: Object pooling
const particlePool = [];
const MAX_PARTICLES = 300;

function initPool() {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particlePool.push({ active: false, x: 0, y: 0 });
  }
}

function spawnParticle() {
  const p = particlePool.find(p => !p.active);
  if (p) {
    p.active = true;
    p.x = 0; p.y = 0; // reuse existing object
  }
}
```

**Detection:** Chrome DevTools Memory Profiler shows heap growing linearly.

**Performance Target:** 200-300 particles max on desktop (60 FPS), 50-80 on mobile.

**Phase:** Visual Effects (Phase 4) - Implement pooling from start.

**Sources:**
- [How We Made Our Canvas Application 30x Faster](https://dev.to/shivuser/how-we-made-our-canvas-application-30x-faster-a-deep-dive-into-performance-engineering-2f8p)
- [JavaScript Particles Background: Complete 2026 Guide](https://copyprogramming.com/howto/javascript-particles-background-js-code-example)

---

### Pitfall 5: Canvas Rendering Inefficiency
**What goes wrong:** 10 enemies + particles drops FPS to 30. Game feels sluggish.

**Why it happens:** Redrawing entire canvas every frame with inefficient rendering calls.

**Consequences:** Can't show impressive multi-enemy battles. Game feels unpolished.

**Prevention:**
- **Use whole numbers for coordinates** (floating point causes blurring, slower)
- **Change `globalAlpha` instead of `fillStyle`** (25x faster)
- **Draw small particles as squares, not circles** (183% faster)
- **Offscreen canvas for static elements** (draw once, reuse)
- **Batch similar drawing operations**

```javascript
// BAD: Changing fillStyle constantly
particles.forEach(p => {
  ctx.fillStyle = `rgba(255,0,0,${p.alpha})`;
  ctx.fillRect(p.x, p.y, 2, 2);
});

// GOOD: Change globalAlpha only
ctx.fillStyle = 'red';
particles.forEach(p => {
  ctx.globalAlpha = p.alpha;
  ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
});
```

**Detection:** FPS counter drops below 55 with >5 enemies.

**Phase:** Performance Optimization (Phase 5) - Profile early.

**Sources:**
- [Optimizing HTML5 Canvas to Improve your Game Performance](https://codetheory.in/optimizing-html5-canvas-to-improve-your-game-performance/)
- [JavaScript Particles Background: Complete 2026 Guide](https://copyprogramming.com/howto/javascript-particles-background-js-code-example)

---

## Gesture Recognition Pitfalls

### Pitfall 6: Too Strict Shape Matching
**What goes wrong:** Players must draw pixel-perfect shapes. Circle requires 95% circularity. Zigzag needs exact angles. 70% of casts fail.

**Why it happens:** Over-tuned recognition algorithm optimized for your drawing style.

**Consequences:** Frustrating gameplay. Judges try 3 times, give up, move to next project.

**Prevention:**
- **Tolerance thresholds:** Circle = 60-70% circularity acceptable
- **Normalize for size/speed:** Same gesture drawn fast/slow should match
- **Grid-based recognition** (Jager: divides into 4x4 grid, tracks path) is more forgiving than point-by-point
- **Visual feedback during drawing** (color changes when shape detected)
- **Success sound immediately** (not after animation completes)

**Recognition Speed Target:** <0.2ms for drawing gestures (Jager library achieves this).

**Detection:** Ask friend to try casting spells. If <80% success rate, too strict.

**Phase:** Gesture Recognition (Phase 3) - Tune after friends playtest.

**Sources:**
- [Hand Gesture Recognition Based on Computer Vision: A Review of Techniques](https://www.mdpi.com/2313-433X/6/8/73)
- [GitHub - vmikhav/jager: Javascript touch gesture recognition library](https://github.com/vmikhav/jager)

---

### Pitfall 7: Input Latency Kills Game Feel
**What goes wrong:** 200ms delay between completing gesture and spell cast. Feels sluggish, disconnected.

**Why it happens:** Recognition algorithm runs synchronously on main thread, blocking render.

**Consequences:** Game feels "laggy" even at 60 FPS. Judges perceive as low quality.

**Prevention:**
- **Visual response <16-50ms** (immediate trail during drawing)
- **Spell cast starts during gesture** (anticipation), completes at end
- **Client-side prediction** (show spell effect immediately, validate after)
- **Async recognition** (Web Worker if needed, but simple grid-based shouldn't require)

**Responsiveness Target:** Professional = <15ms, casual acceptable = <40ms.

**Phase:** Game Feel Polish (Phase 6) - Measure latency.

**Sources:**
- [Measuring Responsiveness in Video Games](https://www.gamedeveloper.com/design/measuring-responsiveness-in-video-games)
- [Input Latency Compensation: The Unsung Hero of Online Game Feel](https://www.wayline.io/blog/input-latency-compensation-online-game-feel)

---

### Pitfall 8: Background Clutter Confuses Recognition
**What goes wrong:** When canvas shows complex background (multiple enemies, particle effects, level art), gesture recognition accuracy drops to 40%.

**Why it happens:** Using computer vision on full canvas instead of isolated drawing layer.

**Consequences:** Spell casting becomes unreliable mid-game when screen is busy.

**Prevention:**
- **Separate drawing layer** (transparent canvas overlay)
- **Clear drawing trail** (bright, high-contrast color)
- **Recognition from path coordinates** (not pixel analysis)
- **Disable background rendering during gesture** (dim slightly)

**Phase:** Architecture (Phase 2) - Layer separation critical.

**Sources:**
- [Hand Gesture Recognition Based on Computer Vision: A Review of Techniques](https://pmc.ncbi.nlm.nih.gov/articles/PMC8321080/)
- [Gesture Detection and Recognition Based on Object Detection in Complex Background](https://www.mdpi.com/2076-3417/13/7/4480)

---

## Architecture Pitfalls

### Pitfall 9: Canvas Inside React State Management
**What goes wrong:** Game state (enemies, player position) stored in React state. Every update triggers re-render, breaking animation loop.

**Why it happens:** Natural React instinct—use useState/useReducer for everything.

**Consequences:** Cannot maintain 60 FPS. Architecture rewrite required mid-hackathon.

**Prevention:**
```javascript
// BAD: Game state in React
const [enemies, setEnemies] = useState([]);
const [player, setPlayer] = useState({ x: 0, y: 0 });

// GOOD: Game state outside React
const gameState = useRef({
  enemies: [],
  player: { x: 0, y: 0 }
});

// Only use React state for UI
const [score, setScore] = useState(0);
const [health, setHealth] = useState(100);
```

**Architecture Pattern:**
- **Canvas Layer:** Pure JS, no React, runs at 60 FPS
- **React Layer:** UI only (health bars, score, menus), updates 1-2x/second
- **Bridge:** useRef + custom events to communicate

**Phase:** Architecture Design (Phase 2) - Must be correct from start.

**Sources:**
- [React UI + Babylon.js : How to Avoid useState Re-Rendering Canvas?](https://forum.babylonjs.com/t/react-ui-babylon-js-how-to-avoid-usestate-re-rendering-canvas/35154)
- [Tips to optimise rendering of a set of elements in React](https://lavrton.com/how-to-optimise-rendering-of-a-set-of-elements-in-react-ad01f5b161ae/)

---

### Pitfall 10: No requestAnimationFrame Cleanup
**What goes wrong:** Component unmounts (navigate away, pause menu), but animation loop keeps running. Memory leak, eventual crash.

**Why it happens:** Forgetting to cancel RAF ID in useEffect cleanup.

**Consequences:** Browser tab slows down over time. Multiple game instances running simultaneously.

**Prevention:**
```javascript
// BAD: No cleanup
useEffect(() => {
  const animate = () => {
    render();
    requestAnimationFrame(animate);
  };
  animate();
}, []); // leak!

// GOOD: Cleanup on unmount
useEffect(() => {
  let rafId;
  const animate = () => {
    render();
    rafId = requestAnimationFrame(animate);
  };
  rafId = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(rafId); // cleanup
}, []);
```

**Detection:** Navigate away from game, check Task Manager—CPU still high.

**Phase:** Core Game Loop (Phase 1) - Include in initial setup.

**Sources:**
- [Animation with Canvas and requestAnimationFrame() in React](https://dev.to/ptifur/animation-with-canvas-and-requestanimationframe-in-react-5ccj)
- [Using requestAnimationFrame with React Hooks](https://css-tricks.com/using-requestanimationframe-with-react-hooks/)

---

## Hackathon Time Traps

### Pitfall 11: Starting Without a Plan
**What goes wrong:** Start coding immediately. 6 hours later, realize architecture doesn't support gesture recognition + particles simultaneously. Must rewrite.

**Why it happens:** Pressure to "show progress" immediately. Skipping design phase.

**Consequences:** Lose 6-10 hours to architecture rework. No time left for polish.

**Prevention:**
- **Hour 0-2: Paper design**
  - Sketch canvas layer architecture
  - List 3-5 core gestures (not 20)
  - Define MVP = 1 enemy type + 2 spells
- **Hour 2-4: Scaffold structure**
  - Canvas setup + React shell
  - Input handling stub
  - Placeholder rendering
- **Hour 4+: Build features**

**Warning Sign:** "I'll fix the architecture later" = red flag.

**Phase:** Planning (Phase 0) - Mandatory before coding.

**Sources:**
- [What are some of the common pitfalls or mistakes to avoid when participating in a hackathon?](https://www.linkedin.com/advice/1/what-some-common-pitfalls-mistakes-avoid-when-participating)
- [Avoid These Five Pitfalls at Your Next Hackathon](https://sloanreview.mit.edu/article/avoid-these-five-pitfalls-at-your-next-hackathon/)

---

### Pitfall 12: Scope Creep ("Just One More Feature")
**What goes wrong:** 20 spell types planned. 5 enemy types. Boss battles. Procedural generation. 24 hours in, have 2 spells, 1 enemy, nothing playable.

**Why it happens:** Excitement overwhelms realism. Can't estimate complexity.

**Consequences:** No working demo. Judges see broken prototype.

**Reality Check:** Most projects accomplish 25% of planned scope in hackathon timeframe.

**Prevention:**
- **MVP = 2 gestures, 1 enemy, 3 levels** (achievable in 12 hours)
- **Feature tiers:**
  - MUST: Circle = fireball, enemies take damage, player loses health
  - SHOULD: 2nd gesture, visual effects, score
  - COULD: More enemy types, power-ups, endless mode
- **16-hour cutoff:** No new features after hour 16, only polish + bugfix

**Warning Sign:** "We can add X during lunch break" = scope creep.

**Phase:** Planning (Phase 0) - Ruthless prioritization.

**Sources:**
- [How to Avoid Scope Creep in Game Development: Tips and Best Practices](https://www.codecks.io/blog/2025/how-to-avoid-scope-creep-in-game-development/)
- [What are some of the common pitfalls or mistakes to avoid when participating in a hackathon?](https://www.linkedin.com/advice/1/what-some-common-pitfalls-mistakes-avoid-when-participating)

---

### Pitfall 13: Leaving Testing to Last Hour
**What goes wrong:** Hour 22: "Let me just test on my phone—OH NO gestures don't work on touch, canvas scaling broken, particles tank FPS."

**Why it happens:** "I'll test later when features are done."

**Consequences:** Critical bugs discovered with no time to fix. Demo device different from dev machine.

**Prevention:**
- **Hour 8: First full playthrough** (end-to-end)
- **Hour 16: Friend playtest** (fresh eyes find UX issues)
- **Hour 20: Demo device test** (laptop you'll present on)
- **Continuous testing:** Every 2 hours, play 1 round

**Time-Blocking Example:**
- 10am-12pm: Code
- 12pm-12:15pm: Test + lunch
- 12:15pm-3pm: Code
- 3pm-3:15pm: Test + break

**Phase:** All phases - Test continuously.

**Sources:**
- [3 Effective Tips for Managing Your Time During a Hackathon](https://tips.hackathon.com/article/3-effective-tips-for-managing-your-time-during-a-hackathon)
- [What are some of the common pitfalls or mistakes to avoid when participating in a hackathon?](https://www.linkedin.com/advice/1/what-some-common-pitfalls-mistakes-avoid-when-participating)

---

### Pitfall 14: No Sleep = Broken Code
**What goes wrong:** Hour 18 without sleep. Simple bug takes 3 hours to find. Write same code twice. Forget to save files.

**Why it happens:** "Hackathon culture" = no sleep. Reality = you're useless after 20 hours.

**Consequences:** Lower productivity than if you'd slept. Make architectural mistakes from fatigue.

**Prevention:**
- **24-hour hackathon:** 4-hour sleep at hour 16
- **48-hour hackathon:** 6 hours sleep night 1, 4 hours night 2
- **Power naps:** 20 minutes every 6 hours

**Productivity Math:**
- 24 hours awake = 12 hours effective work (50% efficiency)
- 20 hours awake + 4 hours sleep = 16 hours effective work (80% efficiency)

**Phase:** Time Management - Schedule sleep.

**Sources:**
- [What are some of the common pitfalls or mistakes to avoid when participating in a hackathon?](https://www.linkedin.com/advice/1/what-some-common-pitfalls-mistakes-avoid-when-participating)
- [How To Manage Time Effectively in Hackathons](https://blog.hackunited.org/how-to-manage-time-effectively-in-hackathons)

---

## Game Feel Pitfalls

### Pitfall 15: No Juice (Visual/Audio Feedback)
**What goes wrong:** Spell casting works mechanically but feels lifeless. Draw circle → enemy loses health (no particle burst, no sound, no screen shake). Judges don't realize spell worked.

**Why it happens:** Focus on mechanics, ignore feel. "I'll add polish later" (never happens).

**Consequences:** Working game that feels broken. Judges think gestures aren't registering.

**Prevention (Minimum Viable Juice):**
- **Gesture trail:** Bright, glowing, fades
- **Cast confirmation:** Flash + sound (even placeholder beep)
- **Impact feedback:** Particle burst at hit point
- **Enemy reaction:** Flash white frame, knockback
- **Screen shake:** 3px on big spells

**Time Budget:** 2 hours for juice = 10x better impression.

**Phase:** Polish (Phase 6) - Non-negotiable for demo.

**Sources:**
- [Measuring Responsiveness in Video Games](https://www.gamedeveloper.com/design/measuring-responsiveness-in-video-games)
- [Motion UI Trends 2026: Interactive Design & Examples](https://lomatechnology.com/blog/motion-ui-trends-2026/2911)

---

### Pitfall 16: Invisible Game State
**What goes wrong:** Player doesn't know: (1) which gesture to draw, (2) if mana is full, (3) why spell failed, (4) if enemy is about to attack.

**Why it happens:** Designer knows the mechanics, forgets players don't.

**Consequences:** Judges give up after 30 seconds. Can't figure out how to play.

**Prevention (Essential UI):**
- **Gesture hint:** Show icon/animation of current available spell
- **Mana bars:** Visual + numerical
- **Gesture feedback:** "Circle Detected!" text on successful recognition
- **Error messages:** "Not enough mana" / "Gesture not recognized"
- **Enemy telegraphs:** Wind-up animation before attack

**Phase:** UI/UX (Phase 6) - Test with someone who hasn't seen the game.

**Sources:**
- [Common Failures Leading to Bad Game Design](https://www.designthegame.com/learning/tutorial/common-failures-leading-bad-game-design)

---

## Balance Tuning Pitfalls

### Pitfall 17: No Time for Balancing
**What goes wrong:** Enemies die in 1 hit (too easy) or take 50 hits (too boring). Player dies instantly or is invincible. Game is broken-easy or impossible.

**Why it happens:** Values guessed, never tested. No time for iteration.

**Consequences:** Unplayable demo. Judges either breeze through or die immediately.

**Prevention (Fast Balance Without Playtesting):**
- **Reference values from similar games**
  - Player health: 100 (standard)
  - Basic enemy health: 20-30 (3-5 hits)
  - Damage: 10-20 per spell
- **Build balance spreadsheet** (5 minutes)
  - Time to kill enemy: 3-5 seconds
  - Enemy attack rate: Every 2-3 seconds
  - Player survival time: 20-30 seconds without dodging
- **Runtime balance controls** (hour 18)
  - Add debug keys: `1` = increase player damage, `2` = reduce enemy health
  - Tune during final testing

**Phase:** Game Logic (Phase 4) - Use proven ratios.

**Sources:**
- [FINDING BALANCE BEFORE PLAYTESTING](https://www.leagueofgamemakers.com/finding-balance-before-playtesting/)
- [AI-Powered Playtesting: Revolutionizing Game Balance](https://www.wayline.io/blog/ai-powered-playtesting-revolutionizing-game-balance)

---

## Prevention Checklist

### Phase 0: Planning (Hours 0-2)
- [ ] Paper sketch of canvas layers (game vs UI)
- [ ] Define MVP: 2 gestures, 1 enemy, win condition
- [ ] List MUST/SHOULD/COULD features (ruthless scope)
- [ ] Sleep schedule planned
- [ ] Identify demo device

### Phase 1: Foundation (Hours 2-6)
- [ ] Canvas + React scaffold (isolated layers)
- [ ] Delta time in game loop (frame-independent)
- [ ] requestAnimationFrame with cleanup
- [ ] Input capture working (draw trail visible)
- [ ] FPS counter displayed

### Phase 2: Core Mechanic (Hours 6-12)
- [ ] Gesture recognition with generous tolerance
- [ ] Object pooling for particles (prevent leaks)
- [ ] Visual feedback on gesture detection
- [ ] Whole numbers for coordinates (no blur)
- [ ] Test on trackpad + mouse

### Phase 3: Gameplay (Hours 12-18)
- [ ] Enemy spawning + damage
- [ ] Player health system
- [ ] Win/lose conditions
- [ ] Balance values from spreadsheet
- [ ] First full playthrough test

### Phase 4: Polish (Hours 18-22)
- [ ] Juice: particles, sounds, screen shake
- [ ] UI: mana bars, gesture hints, error messages
- [ ] Friend playtest (watch them struggle)
- [ ] Fix top 3 confusing points
- [ ] Test on demo device

### Phase 5: Demo Prep (Hours 22-24)
- [ ] 2-minute demo script practiced
- [ ] Keyboard shortcuts as backup
- [ ] Run on demo machine 3 times successfully
- [ ] Memory profiler shows no leaks
- [ ] Final FPS check: >55 fps with max enemies

### Continuous Checks
- [ ] Test every 2 hours (catch bugs early)
- [ ] FPS counter always visible
- [ ] Memory usage monitored
- [ ] Git commit every working feature
- [ ] Ask "Can I demo this right now?" every 4 hours

---

## Emergency Fallbacks

If something breaks last minute:

1. **Gesture recognition fails:** Keyboard shortcuts for spells (Q, W, E keys)
2. **Performance tank:** Reduce max particles from 300 → 50
3. **React re-render storm:** Remove all setState calls, hardcode UI values
4. **Balance broken:** God mode (player invincible) or easy mode (enemies 1-shot)
5. **Canvas crashes:** Fall back to DOM-based version (slower but works)

**Rule:** Always have working version from 4 hours ago saved separately.

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation | Time Lost If Ignored |
|-------|----------------|------------|---------------------|
| Foundation | React state breaks canvas loop | Separate layers from start | 4-6 hours (rewrite) |
| Core Mechanic | No delta time in game loop | Implement immediately | 2-3 hours (refactor) |
| Gesture Recognition | Too strict matching | Test with friend early | 3-4 hours (re-tune) |
| Visual Effects | Particle memory leak | Object pooling from start | 2 hours (debug crash) |
| Polish | No juice/feedback | Budget 2 hours minimum | N/A (looks broken) |
| Demo Prep | Different device fails | Test on demo device hour 20 | 2-4 hours (panic fix) |

---

## Sources

**Performance & Canvas:**
- [Standardize your JavaScript games' framerate for different monitors](https://chriscourses.com/blog/standardize-your-javascript-games-framerate-for-different-monitors)
- [Performant Game Loops in JavaScript](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/)
- [Optimizing HTML5 Canvas to Improve your Game Performance](https://codetheory.in/optimizing-html5-canvas-to-improve-your-game-performance/)
- [JavaScript Particles Background: Complete 2026 Guide](https://copyprogramming.com/howto/javascript-particles-background-js-code-example)

**React-Canvas Integration:**
- [Why Your React App Lags but This Canvas Game Runs at 60FPS](https://dev.to/yzbkaka_dev/why-your-react-app-lags-but-this-canvas-game-runs-at-60fps-2h1d)
- [React.js Optimization Every React Developer Must Know (2026 Edition)](https://medium.com/@muhammadshakir4152/react-js-optimization-every-react-developer-must-know-2026-edition-e1c098f55ee9)
- [Animation with Canvas and requestAnimationFrame() in React](https://dev.to/ptifur/animation-with-canvas-and-requestanimationframe-in-react-5ccj)

**Gesture Recognition:**
- [Hand Gesture Recognition Based on Computer Vision: A Review of Techniques](https://www.mdpi.com/2313-433X/6/8/73)
- [GitHub - vmikhav/jager: Javascript touch gesture recognition library](https://github.com/vmikhav/jager)
- [Gesture Detection and Recognition Based on Object Detection in Complex Background](https://www.mdpi.com/2076-3417/13/7/4480)

**Game Feel:**
- [Measuring Responsiveness in Video Games](https://www.gamedeveloper.com/design/measuring-responsiveness-in-video-games)
- [Input Latency Compensation: The Unsung Hero of Online Game Feel](https://www.wayline.io/blog/input-latency-compensation-online-game-feel)
- [Motion UI Trends 2026: Interactive Design & Examples](https://lomatechnology.com/blog/motion-ui-trends-2026/2911)

**Hackathon Management:**
- [Avoid These Five Pitfalls at Your Next Hackathon](https://sloanreview.mit.edu/article/avoid-these-five-pitfalls-at-your-next-hackathon/)
- [How to Avoid Scope Creep in Game Development](https://www.codecks.io/blog/2025/how-to-avoid-scope-creep-in-game-development/)
- [3 Effective Tips for Managing Your Time During a Hackathon](https://tips.hackathon.com/article/3-effective-tips-for-managing-your-time-during-a-hackathon)

**Balance & Testing:**
- [FINDING BALANCE BEFORE PLAYTESTING](https://www.leagueofgamemakers.com/finding-balance-before-playtesting/)
- [AI-Powered Playtesting: Revolutionizing Game Balance](https://www.wayline.io/blog/ai-powered-playtesting-revolutionizing-game-balance)
