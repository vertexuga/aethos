import Entity from '../Entity.js';
import { SPELL_CONFIG } from '../../data/spellConfig.js';

class EarthWaveEntity extends Entity {
  constructor({ x, y, vx, vy, damageModifier = 1.0 }) {
    const config = SPELL_CONFIG.triangle;

    super({
      x, y,
      vx: 0, vy: 0,
      size: config.size,
      type: 'projectile-earthwave',
      color: config.color
    });

    this.speed = config.speed;
    this.baseDamage = config.baseDamage;
    this.lifetime = config.lifetime;
    this.maxSize = config.maxSize;
    this.stunDuration = config.stunDuration;
    this.damageModifier = damageModifier;
    this.age = 0;
    this.currentRadius = config.size;
    this.ringThickness = 15;
    this.hitEnemies = new Set();

    // Debris particles
    this.debris = [];
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt * 1000;

    // Expand radius
    const progress = this.age / this.lifetime;
    this.currentRadius = this.size + (this.maxSize - this.size) * progress;

    // Spawn debris particles along the ring edge
    if (Math.random() < 0.5) {
      const angle = Math.random() * Math.PI * 2;
      this.debris.push({
        x: this.x + Math.cos(angle) * this.currentRadius,
        y: this.y + Math.sin(angle) * this.currentRadius,
        vx: Math.cos(angle) * 30 + (Math.random() - 0.5) * 20,
        vy: Math.sin(angle) * 30 + (Math.random() - 0.5) * 20 - 20,
        life: 0.4,
        maxLife: 0.4,
        radius: 2 + Math.random() * 3
      });
    }

    // Update debris
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 60 * dt; // gravity
      d.life -= dt;
      if (d.life <= 0) this.debris.splice(i, 1);
    }

    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }

  isEnemyInRing(enemyX, enemyY, enemySize) {
    const dx = enemyX - this.x;
    const dy = enemyY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const innerRadius = this.currentRadius - this.ringThickness;
    const outerRadius = this.currentRadius + this.ringThickness;
    return dist - enemySize < outerRadius && dist + enemySize > innerRadius;
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    const progress = this.age / this.lifetime;
    const alpha = 1 - progress * 0.5;
    ctx.globalAlpha = alpha;

    // Outer ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.ringThickness;
    ctx.stroke();

    // Inner lighter ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(188, 170, 164, 0.5)';
    ctx.lineWidth = this.ringThickness * 0.4;
    ctx.stroke();

    // Debris particles
    for (const d of this.debris) {
      const a = (d.life / d.maxLife) * alpha;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#a1887f';
      ctx.fill();
    }

    ctx.restore();
  }

  getDamage() {
    return this.baseDamage * this.damageModifier;
  }

  reset({ x, y, vx, vy, damageModifier }) {
    const config = SPELL_CONFIG.triangle;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.damageModifier = damageModifier || 1.0;
    this.age = 0;
    this.active = true;
    this.currentRadius = config.size;
    this.hitEnemies = new Set();
    this.debris = [];
  }
}

export default EarthWaveEntity;
