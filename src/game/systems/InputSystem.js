class InputSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.isDrawing = false;
    this.currentPoints = []; // {x, y, timestamp}
    this.trailPoints = []; // {x, y, alpha}
    this.onStopDrawing = null; // Callback for gesture recognition
    this.recognitionResult = null; // Recognition result for trail color change

    // Bind event handlers
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  init() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);

    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
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
    this.recognitionResult = null; // Reset recognition on new drawing
    const point = { x, y, timestamp: Date.now(), alpha: 1.0 };
    this.currentPoints.push(point);
    this.trailPoints.push(point);
  }

  continueDrawing(x, y) {
    if (!this.isDrawing) return;
    const point = { x, y, timestamp: Date.now(), alpha: 1.0 };
    this.currentPoints.push(point);
    this.trailPoints.push(point);

    // Cap trail points to prevent unbounded growth and FPS drops during long draws
    const MAX_TRAIL_POINTS = 200;
    if (this.trailPoints.length > MAX_TRAIL_POINTS) {
      this.trailPoints = this.trailPoints.slice(-MAX_TRAIL_POINTS);
    }
  }

  stopDrawing() {
    this.isDrawing = false;

    // Trigger gesture recognition callback if enough points
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

  update(dt) {
    // Fade out trail points when not drawing
    if (!this.isDrawing) {
      for (const point of this.trailPoints) {
        point.alpha -= dt * 3; // Fades over ~0.3 seconds
      }
    }

    // Remove fully faded points
    this.trailPoints = this.trailPoints.filter(p => p.alpha > 0);
  }

  setRecognitionResult(result) {
    this.recognitionResult = result;
  }

  render(ctx) {
    if (this.trailPoints.length < 2) return;

    ctx.save();

    // Set line style - enhanced width for better visibility
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Color and glow based on recognition state
    let trailColor, shadowColor, shadowBlur;
    if (this.recognitionResult) {
      // Gesture recognized - green trail with bright glow
      trailColor = 'rgba(76, 175, 80, {alpha})';
      shadowColor = 'rgba(129, 199, 132, 0.8)';
      shadowBlur = 20;
    } else {
      // Default - teal trail with light blue glow
      trailColor = 'rgba(74, 143, 143, {alpha})';
      shadowColor = 'rgba(126, 184, 218, 0.6)';
      shadowBlur = 15;
    }

    ctx.shadowBlur = shadowBlur;
    ctx.shadowColor = shadowColor;

    // Batch segments by similar alpha to reduce draw calls
    let batchAlpha = -1;
    ctx.beginPath();
    for (let i = 0; i < this.trailPoints.length - 1; i++) {
      const p1 = this.trailPoints[i];
      const p2 = this.trailPoints[i + 1];
      const alpha = Math.max(0, Math.min(1, p1.alpha));
      const quantizedAlpha = Math.round(alpha * 10) / 10; // Group by 0.1 increments

      if (quantizedAlpha !== batchAlpha) {
        // Flush previous batch
        if (batchAlpha >= 0) ctx.stroke();
        batchAlpha = quantizedAlpha;
        ctx.strokeStyle = trailColor.replace('{alpha}', alpha);
        ctx.beginPath();
      }

      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    // Flush final batch
    if (batchAlpha >= 0) ctx.stroke();

    ctx.restore();
  }

  getPoints() {
    return [...this.currentPoints];
  }

  destroy() {
    // Remove all event listeners
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}

export default InputSystem;
