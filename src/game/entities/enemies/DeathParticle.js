import Entity from '../Entity.js';

class DeathParticle extends Entity {
  constructor({ x, y, vx, vy, color, lifetime = 500 }) {
    super({
      x,
      y,
      vx,
      vy,
      size: 3,
      type: 'particle-death',
      color
    });

    this.lifetime = lifetime; // ms
    this.age = 0;
    this.initialSize = 3;
  }

  update(dt) {
    // Apply velocity movement
    super.update(dt);

    // Increment age
    this.age += dt * 1000;

    // Apply friction/deceleration
    this.vx *= 0.97;
    this.vy *= 0.97;

    // Destroy when lifetime expires
    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }

  render(ctx) {
    if (!this.active) return;

    // Calculate fade-out alpha
    const alpha = 1 - (this.age / this.lifetime);

    // Calculate shrinking size
    const size = this.initialSize * (1 - (this.age / this.lifetime) * 0.5);

    ctx.save();

    // Apply fade-out
    ctx.globalAlpha = alpha;

    // Draw particle circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.restore();
  }

  reset({ x, y, vx, vy, color, lifetime = 500 }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.active = true;
  }
}

export default DeathParticle;
