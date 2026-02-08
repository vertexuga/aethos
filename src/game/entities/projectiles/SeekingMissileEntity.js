import Entity from '../Entity.js';
import { SPELL_CONFIG } from '../../data/spellConfig.js';

class SeekingMissileEntity extends Entity {
  constructor({ x, y, vx, vy, damageModifier = 1.0 }) {
    const config = SPELL_CONFIG.star;

    super({
      x, y, vx, vy,
      size: config.size,
      type: 'projectile-seekingmissile',
      color: config.color
    });

    this.speed = config.speed;
    this.baseDamage = config.baseDamage;
    this.lifetime = config.lifetime;
    this.damageModifier = damageModifier;
    this.age = 0;
    this.hitEnemies = new Set();

    // Waypoint path following
    this.pathWaypoints = null;
    this.pathIdx = 0;
    this.pathProgress = 0;
    this.pathDone = false;

    // Trail particles
    this.trail = [];
  }

  setWaypoints(waypoints) {
    if (!waypoints || waypoints.length < 2) return;
    this.pathWaypoints = waypoints;
    this.pathIdx = 0;
    this.pathProgress = 0;
    this.pathDone = false;
  }

  update(dt) {
    if (!this.active) return;

    // Follow path waypoints
    if (this.pathWaypoints && !this.pathDone) {
      this.followPath(dt);
    } else {
      // Continue straight after path ends
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    this.age += dt * 1000;

    // Trail particles
    if (Math.random() < 0.6) {
      this.trail.push({
        x: this.x + (Math.random() - 0.5) * 6,
        y: this.y + (Math.random() - 0.5) * 6,
        life: 0.3,
        maxLife: 0.3,
        radius: 2 + Math.random() * 3
      });
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }

    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }

  followPath(dt) {
    let remaining = this.speed * dt;
    const wp = this.pathWaypoints;

    while (remaining > 0 && this.pathIdx < wp.length - 1) {
      const from = wp[this.pathIdx];
      const to = wp[this.pathIdx + 1];
      const segDx = to.x - from.x;
      const segDy = to.y - from.y;
      const segLen = Math.sqrt(segDx * segDx + segDy * segDy);

      if (segLen < 0.001) {
        this.pathIdx++;
        this.pathProgress = 0;
        continue;
      }

      const remainingInSeg = segLen * (1 - this.pathProgress);

      if (remaining >= remainingInSeg) {
        remaining -= remainingInSeg;
        this.pathIdx++;
        this.pathProgress = 0;
      } else {
        this.pathProgress += remaining / segLen;
        remaining = 0;
      }
    }

    if (this.pathIdx < wp.length - 1) {
      const from = wp[this.pathIdx];
      const to = wp[this.pathIdx + 1];
      this.x = from.x + (to.x - from.x) * this.pathProgress;
      this.y = from.y + (to.y - from.y) * this.pathProgress;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        this.vx = (dx / len) * this.speed;
        this.vy = (dy / len) * this.speed;
      }
    } else {
      // Done with path
      this.pathDone = true;
      const n = wp.length;
      this.x = wp[n - 1].x;
      this.y = wp[n - 1].y;

      if (n >= 2) {
        const dx = wp[n - 1].x - wp[n - 2].x;
        const dy = wp[n - 1].y - wp[n - 2].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          this.vx = (dx / len) * this.speed;
          this.vy = (dy / len) * this.speed;
        }
      }
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Trail
    for (const p of this.trail) {
      const alpha = (p.life / p.maxLife) * 0.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ce93d8';
      ctx.fill();
    }

    const brightness = 0.7 + 0.3 * this.damageModifier;
    ctx.globalAlpha = brightness;

    const pulse = 1.0 + 0.15 * Math.sin(this.age * 0.01);
    const glowSize = this.size * pulse;

    // Outer glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(224, 64, 251, 0.15)';
    ctx.fill();

    // Main body
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Bright core
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#f3e5f5';
    ctx.fill();

    ctx.restore();
  }

  getDamage() {
    return this.baseDamage * this.damageModifier;
  }

  reset({ x, y, vx, vy, damageModifier, waypoints }) {
    this.x = x;
    this.y = y;
    this.vx = vx || 0;
    this.vy = vy || 0;
    this.damageModifier = damageModifier || 1.0;
    this.age = 0;
    this.active = true;
    this.hitEnemies = new Set();
    this.trail = [];
    this.pathWaypoints = null;
    this.pathIdx = 0;
    this.pathProgress = 0;
    this.pathDone = false;

    if (waypoints && waypoints.length >= 2) {
      this.setWaypoints(waypoints);
    }
  }
}

export default SeekingMissileEntity;
