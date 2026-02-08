class Camera {
  constructor(viewWidth, viewHeight, worldWidth, worldHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDecay = 12; // per second
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.shakeMax = 6;
  }

  follow(target, dt) {
    const targetX = target.x - this.viewWidth / 2;
    const targetY = target.y - this.viewHeight / 2;

    const lerp = 1 - Math.pow(1 - 0.08, dt * 60);
    this.x += (targetX - this.x) * lerp;
    this.y += (targetY - this.y) * lerp;

    this.clamp();
  }

  clamp() {
    this.x = Math.max(0, Math.min(this.worldWidth - this.viewWidth, this.x));
    this.y = Math.max(0, Math.min(this.worldHeight - this.viewHeight, this.y));
  }

  shake(intensity) {
    this.shakeIntensity = Math.min(intensity, this.shakeMax);
  }

  updateShake(dt) {
    if (this.shakeIntensity > 0.1) {
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity -= this.shakeDecay * dt;
    } else {
      this.shakeIntensity = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  applyTransform(ctx) {
    ctx.save();
    ctx.translate(-this.x + this.shakeOffsetX, -this.y + this.shakeOffsetY);
  }

  restore(ctx) {
    ctx.restore();
  }

  screenToWorld(sx, sy) {
    return { x: sx + this.x, y: sy + this.y };
  }

  worldToScreen(wx, wy) {
    return { x: wx - this.x, y: wy - this.y };
  }

  resize(viewWidth, viewHeight) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }
}

export default Camera;
