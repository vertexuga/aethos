class InputSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.isDrawing = false;
    this.currentPoints = []; // {x, y, timestamp}
    this.trailPoints = []; // {x, y, alpha}

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
    const point = { x, y, timestamp: Date.now(), alpha: 1.0 };
    this.currentPoints.push(point);
    this.trailPoints.push(point);
  }

  continueDrawing(x, y) {
    if (!this.isDrawing) return;
    const point = { x, y, timestamp: Date.now(), alpha: 1.0 };
    this.currentPoints.push(point);
    this.trailPoints.push(point);
  }

  stopDrawing() {
    this.isDrawing = false;
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

  render(ctx) {
    if (this.trailPoints.length < 2) return;

    ctx.save();

    // Set line style
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(126, 184, 218, 0.6)';

    // Draw each segment with its own alpha
    for (let i = 0; i < this.trailPoints.length - 1; i++) {
      const p1 = this.trailPoints[i];
      const p2 = this.trailPoints[i + 1];

      // Use the alpha from the first point
      const alpha = Math.max(0, Math.min(1, p1.alpha));
      ctx.strokeStyle = `rgba(74, 143, 143, ${alpha})`;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

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
