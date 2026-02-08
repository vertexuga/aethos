import Entity from '../Entity.js';
import { SPELL_CONFIG } from '../../data/spellConfig.js';

class BasicAttackEntity extends Entity {
  constructor({ x, y, vx, vy, damageModifier = 1.0 }) {
    const config = SPELL_CONFIG.basic;

    super({
      x, y, vx, vy,
      size: config.size,
      type: 'projectile-basicattack',
      color: config.color
    });

    this.speed = config.speed;
    this.baseDamage = config.baseDamage;
    this.lifetime = config.lifetime;
    this.damageModifier = damageModifier;
    this.age = 0;
    this.hitEnemies = new Set();
  }

  update(dt) {
    if (!this.active) return;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.age += dt * 1000;

    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const brightness = 0.5 + 0.3 * this.damageModifier;
    ctx.globalAlpha = brightness;

    const pulse = 1.0 + 0.1 * Math.sin(this.age * 0.008);
    const glowSize = this.size * pulse;

    // Trail behind
    const angle = Math.atan2(this.vy, this.vx);
    for (let i = 1; i <= 3; i++) {
      const tx = this.x - Math.cos(angle) * i * 5;
      const ty = this.y - Math.sin(angle) * i * 5;
      ctx.globalAlpha = brightness * (1 - i / 4) * 0.4;
      ctx.beginPath();
      ctx.arc(tx, ty, glowSize * (1 - i * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = '#90a4ae';
      ctx.fill();
    }

    ctx.globalAlpha = brightness;

    // Main body
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#eceff1';
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
    this.damageModifier = damageModifier || 1.0;
    this.age = 0;
    this.active = true;
    this.hitEnemies = new Set();
  }
}

export default BasicAttackEntity;
