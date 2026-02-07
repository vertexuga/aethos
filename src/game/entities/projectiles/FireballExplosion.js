import Entity from '../Entity.js';

class FireballExplosion extends Entity {
  constructor({ x, y, damageModifier = 1.0 }) {
    super({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 0,
      type: 'vfx-explosion',
      color: '#ff6b35'
    });

    // Explosion parameters
    this.damageModifier = damageModifier;
    this.maxRadius = 40 * (0.6 + 0.4 * damageModifier); // sloppy = 24px, perfect = 40px
    this.currentRadius = 0;
    this.expansionSpeed = 150; // px/sec
    this.lifetime = 400; // 0.4 seconds (milliseconds)
    this.age = 0; // milliseconds
  }

  update(dt) {
    // Increment age
    this.age += dt * 1000;

    // Expand radius
    this.currentRadius += this.expansionSpeed * dt;
    if (this.currentRadius > this.maxRadius) {
      this.currentRadius = this.maxRadius;
    }

    // Destroy when lifetime expires
    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // Additive blending for explosion effect
    ctx.globalCompositeOperation = 'lighter';

    // Calculate fade alpha (fade out over lifetime)
    const fadeProgress = this.age / this.lifetime;
    const baseAlpha = 1 - fadeProgress; // Fade from 1 to 0

    // Outer expanding ring (orange)
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = baseAlpha * 0.8;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow (bright yellow)
    const innerRadius = this.currentRadius * 0.6;
    const innerAlpha = baseAlpha * 0.6 * this.damageModifier;

    ctx.globalAlpha = innerAlpha;
    ctx.fillStyle = '#ffdf00'; // Bright yellow-gold
    ctx.beginPath();
    ctx.arc(this.x, this.y, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  reset({ x, y, damageModifier }) {
    this.x = x;
    this.y = y;
    this.damageModifier = damageModifier;
    this.maxRadius = 40 * (0.6 + 0.4 * damageModifier);
    this.currentRadius = 0;
    this.age = 0;
    this.active = true;
  }
}

export default FireballExplosion;
