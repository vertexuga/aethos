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
    this.onExpire = null; // Callback for explosion trigger
  }

  update(dt) {
    // Follow arc waypoints if available, otherwise fly straight
    if (!this.followWaypoints(dt)) {
      super.update(dt);
    }

    // Increment age in milliseconds
    this.age += dt * 1000;

    // Auto-destroy after lifetime
    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }

  destroy() {
    // Trigger explosion callback before destroying
    if (this.onExpire && this.active) {
      this.onExpire(this.x, this.y, this.damageModifier);
    }
    super.destroy();
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // Additive blending for glow
    ctx.globalCompositeOperation = 'lighter';

    // Accuracy-based visual scaling
    const sizeScale = 0.7 + 0.3 * this.damageModifier;
    const scaledSize = this.size * sizeScale;

    // Brightness: sloppy = 0.8, perfect = 1.0
    const brightness = 0.6 + 0.4 * this.damageModifier;
    ctx.globalAlpha = brightness;

    // Shadow glow: sloppy = 9, perfect = 12
    ctx.shadowBlur = 6 + 6 * this.damageModifier;
    ctx.shadowColor = this.color;

    // Draw outer circle (orange)
    ctx.beginPath();
    ctx.arc(this.x, this.y, scaledSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Inner glow scales with accuracy
    const innerGlowAlpha = 0.6 * this.damageModifier;
    const innerGlowRadius = scaledSize * 0.5 * (0.8 + 0.2 * this.damageModifier);

    // Draw inner circle (bright yellow)
    ctx.beginPath();
    ctx.arc(this.x, this.y, innerGlowRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 150, ${innerGlowAlpha})`;
    ctx.fill();

    ctx.restore();
  }

  getDamage() {
    return this.baseDamage * this.damageModifier;
  }

  reset({ x, y, vx, vy, damageModifier, waypoints }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damageModifier = damageModifier;
    this.waypoints = waypoints || null;
    this.waypointIdx = 0;
    this.waypointProgress = 0;
    this.waypointsDone = false;
    this.age = 0;
    this.onExpire = null;
    this.active = true;
  }
}

export default FireballEntity;
