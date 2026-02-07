import Entity from '../Entity.js';
import { SPELL_CONFIG } from '../../data/spellConfig.js';

class MagicMissileEntity extends Entity {
  constructor({ x, y, vx, vy, damageModifier = 1.0 }) {
    const config = SPELL_CONFIG.triangle;

    super({
      x,
      y,
      vx,
      vy,
      size: config.size,
      type: 'projectile-magicmissile',
      color: config.color
    });

    this.speed = config.speed; // Store for future homing (Phase 4)
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

    // Calculate rotation angle from velocity
    const angle = Math.atan2(this.vy, this.vx);

    // Translate and rotate canvas to projectile position
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Draw elongated ellipse pointing in direction of travel
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 1.5, this.size * 0.6, 0, 0, Math.PI * 2);
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

export default MagicMissileEntity;
