import Entity from '../Entity.js';
import { SPELL_CONFIG } from '../../data/spellConfig.js';

class FireballEntity extends Entity {
  constructor({ x, y, vx, vy, damageModifier = 1.0 }) {
    const config = SPELL_CONFIG.zigzag;

    super({
      x,
      y,
      vx,
      vy,
      size: config.size,
      type: 'projectile-fireball',
      color: config.color
    });

    this.baseDamage = config.baseDamage;
    this.lifetime = config.lifetime;
    this.explosionRadius = config.explosionRadius;
    this.damageModifier = damageModifier;
    this.age = 0; // milliseconds
  }

  update(dt) {
    super.update(dt);

    // Increment age in milliseconds
    this.age += dt * 1000;

    // Auto-destroy after lifetime
    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // Additive blending for glow
    ctx.globalCompositeOperation = 'lighter';

    // Outer glow (orange)
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;

    // Draw outer circle (orange)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Draw inner circle (bright yellow)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 150, 0.6)';
    ctx.fill();

    ctx.restore();
  }

  getDamage() {
    return this.baseDamage * this.damageModifier;
  }

  reset({ x, y, vx, vy, damageModifier }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damageModifier = damageModifier;
    this.age = 0;
    this.active = true;
  }
}

export default FireballEntity;
