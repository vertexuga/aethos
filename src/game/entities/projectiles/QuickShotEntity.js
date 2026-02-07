import Entity from '../Entity.js';
import { SPELL_CONFIG } from '../../data/spellConfig.js';

class QuickShotEntity extends Entity {
  constructor({ x, y, vx, vy, damageModifier = 1.0 }) {
    const config = SPELL_CONFIG.circle;

    super({
      x,
      y,
      vx,
      vy,
      size: config.size,
      type: 'projectile-quickshot',
      color: config.color
    });

    this.speed = config.speed;
    this.baseDamage = config.baseDamage;
    this.lifetime = config.lifetime;
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

    // Shadow glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;

    // Draw filled circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
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

export default QuickShotEntity;
