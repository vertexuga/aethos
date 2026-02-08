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

    this.speed = config.speed;
    this.baseDamage = config.baseDamage;
    this.lifetime = config.lifetime;
    this.damageModifier = damageModifier;
    this.element = config.element; // 'water'
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

    // Brightness
    const brightness = 0.6 + 0.4 * this.damageModifier;
    ctx.globalAlpha = brightness;

    // Shadow glow
    ctx.shadowBlur = 10 + 8 * this.damageModifier;
    ctx.shadowColor = this.color;

    // Calculate rotation angle from velocity
    const angle = Math.atan2(this.vy, this.vx);

    // Translate and rotate canvas to projectile position
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Accuracy-based scaling
    const sizeScale = 0.7 + 0.3 * this.damageModifier;

    // Draw water trail (5 droplets behind)
    const trailCount = 5;
    for (let i = 1; i <= trailCount; i++) {
      const trailX = -i * 6;
      const trailAlpha = (1 - i / (trailCount + 1)) * brightness * 0.4;
      const trailSize = this.size * 0.5 * (1 - i / (trailCount + 1)) * sizeScale;

      ctx.globalAlpha = trailAlpha;
      ctx.beginPath();
      ctx.arc(trailX, (i % 2 === 0 ? 1 : -1) * 2, trailSize, 0, Math.PI * 2);
      ctx.fillStyle = '#81d4fa';
      ctx.fill();
    }

    // Reset alpha for main body
    ctx.globalAlpha = brightness;

    // Pulsing wave effect
    const pulse = 1.0 + 0.1 * Math.sin(this.age * 0.01);
    const radiusX = this.size * 1.6 * sizeScale * pulse;
    const radiusY = this.size * 0.8 * sizeScale * pulse;

    // Outer water aura
    ctx.globalAlpha = brightness * 0.3;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX * 1.4, radiusY * 1.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#4fc3f7';
    ctx.fill();

    // Main elongated body
    ctx.globalAlpha = brightness;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Bright core
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX * 0.3, radiusY * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e1f5fe';
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

export default MagicMissileEntity;
