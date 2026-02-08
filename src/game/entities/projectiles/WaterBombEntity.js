import Entity from '../Entity.js';
import { SPELL_CONFIG } from '../../data/spellConfig.js';

class WaterBombEntity extends Entity {
  constructor({ x, y, vx, vy, damageModifier = 1.0 }) {
    const config = SPELL_CONFIG.circle;

    super({
      x, y, vx, vy,
      size: config.size,
      type: 'projectile-waterbomb',
      color: config.color
    });

    this.speed = config.speed;
    this.baseDamage = config.baseDamage;
    this.lifetime = config.lifetime;
    this.splashRadius = config.splashRadius;
    this.damageModifier = damageModifier;
    this.age = 0;
    this.hitEnemies = new Set();
    this.hasExploded = false;

    // Callback for explosion + puddle spawn
    this.onHitCallback = null;

    // Wobble animation
    this.wobblePhase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    if (!this.active) return;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.age += dt * 1000;
    this.wobblePhase += dt * 10;

    // Explode at end of lifetime even if no hit
    if (this.age >= this.lifetime && !this.hasExploded) {
      this.explode();
    }
  }

  explode() {
    if (this.hasExploded) return;
    this.hasExploded = true;
    if (this.onHitCallback) {
      this.onHitCallback(this.x, this.y, this.damageModifier);
    }
    this.destroy();
  }

  onHit(enemy) {
    // Called by collision system on first enemy hit
    this.explode();
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const brightness = 0.7 + 0.3 * this.damageModifier;
    ctx.globalAlpha = brightness;

    const wobble = 1.0 + 0.1 * Math.sin(this.wobblePhase);
    const size = this.size * wobble;

    // Outer water aura
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(41, 182, 246, 0.15)';
    ctx.fill();

    // Water droplet body
    ctx.beginPath();
    ctx.arc(this.x, this.y - size * 0.2, size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(this.x - size * 0.25, this.y - size * 0.4, size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
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
    this.hasExploded = false;
    this.hitEnemies = new Set();
    this.onHitCallback = null;
    this.wobblePhase = Math.random() * Math.PI * 2;
  }
}

export default WaterBombEntity;
