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

    // Accuracy-based visual scaling
    // Size: sloppy (0.5 mod) = 70%, perfect (1.0 mod) = 100%
    const sizeScale = 0.7 + 0.3 * this.damageModifier;
    const scaledSize = this.size * sizeScale;

    // Brightness: sloppy = 0.8 alpha, perfect = 1.0
    const brightness = 0.6 + 0.4 * this.damageModifier;
    ctx.globalAlpha = brightness;

    // Shadow glow: sloppy = 9, perfect = 12
    ctx.shadowBlur = 6 + 6 * this.damageModifier;
    ctx.shadowColor = this.color;

    // Draw filled circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, scaledSize, 0, Math.PI * 2);
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
