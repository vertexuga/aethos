import { SPELL_CONFIG } from '../data/spellConfig.js';

// Spell name → trail RGB for real-time coloring
const SPELL_TRAIL_COLORS = {
  circle:   { r: 77,  g: 208, b: 225 },  // cyan (QuickShot)
  triangle: { r: 128, g: 222, b: 234 },  // light-cyan (MagicMissile)
  zigzag:   { r: 255, g: 107, b: 53  },  // orange (Fireball)
};

// Gold color for arc aiming trail
const ARC_COLOR = { r: 255, g: 215, b: 0 };

// Straight tail detection parameters
const ANGLE_THRESHOLD = 30 * Math.PI / 180; // 30° — segments within this are "straight"
const MIN_STRAIGHT_COUNT = 4; // Need 4+ consecutive straight segments to trigger
const MIN_STRAIGHT_DIST = 15; // Straight section must span at least 15px

class InputSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.isDrawing = false;
    this.currentPoints = []; // {x, y, timestamp}
    this.trailPoints = []; // {x, y, alpha, phase}
    this.onStopDrawing = null; // Callback for final gesture recognition
    this.onShapeClosed = null; // Callback for real-time recognition (closure or straight tail)

    // Real-time detection state
    this.closureDetected = false;
    this.straightTailActive = false;
    this.straightCount = 0; // consecutive straight segments from the end
    this.spellTrailColor = null;
    this.maxDistFromStart = 0;

    // Closure detection parameters
    this.CLOSURE_THRESHOLD = 50;
    this.MIN_SHAPE_POINTS = 10;
    this.MIN_EXCURSION = 80;

    // Bind event handlers
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);
  }

  init() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel);
  }

  getCanvasCoords(pageX, pageY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: pageX - rect.left,
      y: pageY - rect.top,
      timestamp: Date.now()
    };
  }

  startDrawing(x, y) {
    this.isDrawing = true;
    this.currentPoints = [];
    this.closureDetected = false;
    this.straightTailActive = false;
    this.straightCount = 0;
    this.spellTrailColor = null;
    this.maxDistFromStart = 0;

    const point = { x, y, timestamp: Date.now(), alpha: 1.0, phase: 'drawing' };
    this.currentPoints.push(point);
    this.trailPoints.push(point);
  }

  continueDrawing(x, y) {
    if (!this.isDrawing) return;

    // Determine phase for this new point
    let phase = 'drawing';
    if (this.closureDetected || this.straightTailActive) phase = 'arc';

    const point = { x, y, timestamp: Date.now(), alpha: 1.0, phase };
    this.currentPoints.push(point);
    this.trailPoints.push(point);

    // Track max distance from start for closure detection
    if (!this.closureDetected) {
      const start = this.currentPoints[0];
      const dx = x - start.x;
      const dy = y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.maxDistFromStart = Math.max(this.maxDistFromStart, dist);
    }

    // 1. Closure detection (circle, triangle — path returns near start)
    if (!this.closureDetected && !this.straightTailActive
        && this.currentPoints.length >= this.MIN_SHAPE_POINTS
        && this.maxDistFromStart >= this.MIN_EXCURSION) {
      const start = this.currentPoints[0];
      const dx = x - start.x;
      const dy = y - start.y;
      if (Math.sqrt(dx * dx + dy * dy) < this.CLOSURE_THRESHOLD) {
        this.closureDetected = true;

        for (const p of this.trailPoints) {
          if (p.phase === 'drawing') p.phase = 'shape';
        }

        if (this.onShapeClosed) {
          this.onShapeClosed(this.currentPoints.slice(0, this.currentPoints.length));
        }
      }
    }

    // 2. Straight tail detection (for all shapes — detects aiming line)
    if (!this.closureDetected) {
      this.detectStraightTail();
    }

    // Cap trail points
    const MAX_TRAIL_POINTS = 200;
    if (this.trailPoints.length > MAX_TRAIL_POINTS) {
      this.trailPoints = this.trailPoints.slice(-MAX_TRAIL_POINTS);
    }
  }

  /**
   * Check if the latest segment continues a straight line.
   * Tracks consecutive straight segments from the end.
   * When enough straight segments accumulate, triggers spell recognition on the shape portion.
   */
  detectStraightTail() {
    const pts = this.currentPoints;
    if (pts.length < 4) return;

    const n = pts.length;
    const prev = pts[n - 3];
    const curr = pts[n - 2];
    const next = pts[n - 1];

    // Skip if segments are too short for reliable angle measurement
    // (sub-pixel mouse moves produce random angles that break detection)
    const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
    if (Math.sqrt(dx1 * dx1 + dy1 * dy1) < 3 || Math.sqrt(dx2 * dx2 + dy2 * dy2) < 3) {
      return; // Skip noisy data — don't count or reset
    }

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);

    let angleDiff = Math.abs(angle2 - angle1);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    if (angleDiff < ANGLE_THRESHOLD) {
      this.straightCount++;
      this.nonStraightCount = 0;
    } else {
      this.nonStraightCount = (this.nonStraightCount || 0) + 1;

      // Once active, only clear after 3+ consecutive non-straight segments (hysteresis)
      if (this.straightTailActive && this.nonStraightCount >= 3) {
        this.clearStraightTail();
        this.straightCount = 0;
      } else if (!this.straightTailActive) {
        this.straightCount = 0;
      }
      return;
    }

    // Enough straight segments and enough distance?
    if (this.straightCount >= MIN_STRAIGHT_COUNT && !this.straightTailActive) {
      const tailLength = this.straightCount + 2;
      const tailStartPt = pts[n - tailLength];
      const tailEndPt = pts[n - 1];
      const dx = tailEndPt.x - tailStartPt.x;
      const dy = tailEndPt.y - tailStartPt.y;

      if (Math.sqrt(dx * dx + dy * dy) >= MIN_STRAIGHT_DIST) {
        this.straightTailActive = true;
        this.nonStraightCount = 0;

        // Re-tag trail points: last tailLength = arc, rest = shape
        this.retagTrailForStraightTail(tailLength);

        // Run early recognition on shape portion
        const shapePoints = pts.slice(0, n - tailLength);
        if (shapePoints.length >= 10 && this.onShapeClosed) {
          this.onShapeClosed(shapePoints);
        }
      }
    }
  }

  /**
   * Re-tag the last tailLength trail points as 'arc' and preceding points as 'shape' (if recognized).
   */
  retagTrailForStraightTail(tailLength) {
    const arcStart = this.trailPoints.length - tailLength;

    for (let i = this.trailPoints.length - 1; i >= 0; i--) {
      if (i >= arcStart) {
        this.trailPoints[i].phase = 'arc';
      } else if (this.trailPoints[i].phase === 'drawing' && this.spellTrailColor) {
        this.trailPoints[i].phase = 'shape';
      }
    }
  }

  /**
   * Clear straight tail state — user curved again, tail is no longer straight.
   */
  clearStraightTail() {
    this.straightTailActive = false;
    this.spellTrailColor = null;

    // Re-tag arc/shape points back to drawing
    for (const p of this.trailPoints) {
      if (p.phase === 'arc' || p.phase === 'shape') {
        p.phase = 'drawing';
      }
    }
  }

  /**
   * Called by GameEngine after early recognition (closure/straight tail) or final recognition (release).
   * Sets the spell trail color based on recognized gesture name.
   */
  setSpellRecognition(gestureName) {
    const color = SPELL_TRAIL_COLORS[gestureName];
    if (color) {
      this.spellTrailColor = color;
    }

    // Tag all non-arc drawing points as 'shape'
    for (const p of this.trailPoints) {
      if (p.phase === 'drawing') p.phase = 'shape';
    }
  }

  stopDrawing() {
    this.isDrawing = false;

    if (this.onStopDrawing && typeof this.onStopDrawing === 'function') {
      if (this.currentPoints.length >= 10) {
        this.onStopDrawing(this.getPoints());
      }
    }
  }

  handleMouseDown(e) {
    const coords = this.getCanvasCoords(e.pageX, e.pageY);
    this.startDrawing(coords.x, coords.y);
  }

  handleMouseMove(e) {
    const coords = this.getCanvasCoords(e.pageX, e.pageY);
    this.continueDrawing(coords.x, coords.y);
  }

  handleMouseUp(e) {
    this.stopDrawing();
  }

  handleMouseLeave(e) {
    if (this.isDrawing) {
      this.stopDrawing();
    }
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const coords = this.getCanvasCoords(touch.pageX, touch.pageY);
    this.startDrawing(coords.x, coords.y);
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const coords = this.getCanvasCoords(touch.pageX, touch.pageY);
    this.continueDrawing(coords.x, coords.y);
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.stopDrawing();
  }

  handleTouchCancel(e) {
    e.preventDefault();
    if (this.isDrawing) {
      this.stopDrawing();
    }
  }

  update(dt) {
    if (!this.isDrawing) {
      for (const point of this.trailPoints) {
        point.alpha -= dt * 3;
      }
    }
    this.trailPoints = this.trailPoints.filter(p => p.alpha > 0);
  }

  render(ctx) {
    if (this.trailPoints.length < 2) return;

    ctx.save();
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let batchPhase = null;
    let batchAlpha = -1;

    for (let i = 0; i < this.trailPoints.length - 1; i++) {
      const p1 = this.trailPoints[i];
      const p2 = this.trailPoints[i + 1];
      const alpha = Math.max(0, Math.min(1, p1.alpha));
      if (alpha <= 0) continue;

      const quantizedAlpha = Math.round(alpha * 10) / 10;
      const phase = p1.phase;

      if (phase !== batchPhase || quantizedAlpha !== batchAlpha) {
        if (batchAlpha >= 0) ctx.stroke();

        batchPhase = phase;
        batchAlpha = quantizedAlpha;

        if (phase === 'shape' && this.spellTrailColor) {
          const c = this.spellTrailColor;
          ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
          ctx.shadowColor = `rgba(${c.r}, ${c.g}, ${c.b}, 0.8)`;
          ctx.shadowBlur = 20;
        } else if (phase === 'arc') {
          ctx.strokeStyle = `rgba(${ARC_COLOR.r}, ${ARC_COLOR.g}, ${ARC_COLOR.b}, ${alpha})`;
          ctx.shadowColor = `rgba(${ARC_COLOR.r}, ${ARC_COLOR.g}, ${ARC_COLOR.b}, 0.6)`;
          ctx.shadowBlur = 12;
        } else {
          ctx.strokeStyle = `rgba(74, 143, 143, ${alpha})`;
          ctx.shadowColor = 'rgba(126, 184, 218, 0.6)';
          ctx.shadowBlur = 15;
        }

        ctx.beginPath();
      }

      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }

    if (batchAlpha >= 0) ctx.stroke();

    ctx.restore();
  }

  getPoints() {
    return [...this.currentPoints];
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchCancel);
  }
}

export default InputSystem;
