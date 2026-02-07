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

    // Accuracy-based visual scaling
    // Brightness: sloppy = 0.8 alpha, perfect = 1.0
    const brightness = 0.6 + 0.4 * this.damageModifier;
    ctx.globalAlpha = brightness;

    // Shadow glow: sloppy = 9, perfect = 12
    ctx.shadowBlur = 6 + 6 * this.damageModifier;
    ctx.shadowColor = this.color;

    // Calculate rotation angle from velocity
    const angle = Math.atan2(this.vy, this.vx);
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    // Translate and rotate canvas to projectile position
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Draw tail trail (2-3 smaller circles behind the projectile)
    const trailCount = 3;
    for (let i = 1; i <= trailCount; i++) {
      const trailX = -i * 4; // Behind the projectile
      const trailAlpha = (1 - i / (trailCount + 1)) * brightness * 0.5;
      const trailSize = this.size * 0.4 * (1 - i / (trailCount + 1));

      ctx.globalAlpha = trailAlpha;
      ctx.beginPath();
      ctx.arc(trailX, 0, trailSize, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    // Reset alpha for main projectile
    ctx.globalAlpha = brightness;

    // Ellipse size scales with damageModifier
    const sizeScale = 0.7 + 0.3 * this.damageModifier;
    const radiusX = this.size * 1.5 * sizeScale;
    const radiusY = this.size * 0.6 * sizeScale;

    // Draw elongated ellipse pointing in direction of travel
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
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
