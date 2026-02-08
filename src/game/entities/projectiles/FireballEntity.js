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
    this.element = config.element; // 'fire'
    this.age = 0; // milliseconds
    this.onExpire = null; // Callback for explosion trigger
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

    // Brightness
    const brightness = 0.6 + 0.4 * this.damageModifier;
    ctx.globalAlpha = brightness;

    // Flickering flame effect
    const flicker = 1.0 + 0.2 * Math.sin(this.age * 0.015) + 0.1 * Math.sin(this.age * 0.023);
    const flickerSize = scaledSize * flicker;

    // Shadow glow (intense fire)
    ctx.shadowBlur = 15 + 10 * this.damageModifier;
    ctx.shadowColor = '#ff4500';

    // Ember trail particles (drawn behind)
    const angle = Math.atan2(this.vy, this.vx);
    for (let i = 1; i <= 4; i++) {
      const trailDist = i * 8;
      const tx = this.x - Math.cos(angle) * trailDist;
      const ty = this.y - Math.sin(angle) * trailDist;
      const jitterX = (Math.sin(this.age * 0.02 + i * 1.7)) * 3;
      const jitterY = (Math.cos(this.age * 0.025 + i * 2.3)) * 3;
      const trailAlpha = (1 - i / 5) * brightness * 0.5;
      const trailSize = scaledSize * 0.4 * (1 - i / 5);

      ctx.globalAlpha = trailAlpha;
      ctx.beginPath();
      ctx.arc(tx + jitterX, ty + jitterY, trailSize, 0, Math.PI * 2);
      ctx.fillStyle = i <= 2 ? '#ff9800' : '#ff5722';
      ctx.fill();
    }

    // Reset alpha
    ctx.globalAlpha = brightness;

    // Outer heat haze
    ctx.beginPath();
    ctx.arc(this.x, this.y, flickerSize * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 87, 34, 0.15)`;
    ctx.fill();

    // Draw outer circle (orange)
    ctx.beginPath();
    ctx.arc(this.x, this.y, flickerSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Inner glow (bright yellow-white core)
    const innerGlowAlpha = 0.7 * this.damageModifier;
    const innerGlowRadius = flickerSize * 0.5 * (0.8 + 0.2 * this.damageModifier);

    ctx.globalAlpha = innerGlowAlpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, innerGlowRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff9c4';
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
    this.hitEnemies = new Set(); // Reset piercing tracking
  }
}

export default FireballEntity;
