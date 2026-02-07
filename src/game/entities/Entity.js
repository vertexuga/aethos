class Entity {
  static idCounter = 0;

  constructor({ x, y, vx = 0, vy = 0, size = 10, type = 'generic', color = '#4a8f8f' }) {
    this.id = `entity_${Entity.idCounter++}`;
    this.x = x;
    this.y = y;
    this.vx = vx; // pixels per second
    this.vy = vy; // pixels per second
    this.size = size;
    this.type = type;
    this.color = color;
    this.active = true;
  }

  update(dt) {
    // dt is in seconds (already divided by 1000 in game loop)
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx, interpolation) {
    if (!this.active) return;

    // Draw filled circle with subtle glow
    ctx.save();

    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.restore();
  }

  destroy() {
    this.active = false;
  }
}

export default Entity;
