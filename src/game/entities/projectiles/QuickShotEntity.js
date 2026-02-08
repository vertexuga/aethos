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
    this.element = config.element; // null — no element
    this.age = 0; // milliseconds
    this.hitEnemies = new Set(); // Piercing tracking
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

  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // Additive blending for glow
    ctx.globalCompositeOperation = 'lighter';

    // Accuracy-based visual scaling
    const sizeScale = 0.7 + 0.3 * this.damageModifier;
    const scaledSize = this.size * sizeScale;

    // Brightness
    const brightness = 0.6 + 0.4 * this.damageModifier;
    ctx.globalAlpha = brightness;

    // Pulsing glow effect
    const pulse = 1.0 + 0.15 * Math.sin(this.age * 0.008);
    const glowSize = scaledSize * pulse;

    // Outer glow ring
    ctx.shadowBlur = 12 + 8 * this.damageModifier;
    ctx.shadowColor = this.color;

    // Draw outer glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(77, 208, 225, 0.15)`;
    ctx.fill();

    // Draw main circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Draw bright core
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
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
    this.active = true;
    this.hitEnemies = new Set(); // Reset piercing tracking
  }
}

export default QuickShotEntity;
