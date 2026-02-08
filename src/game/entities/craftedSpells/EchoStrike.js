import { CRAFTED_SPELL_CONFIG } from '../../data/craftedSpellConfig.js';

const CONFIG = CRAFTED_SPELL_CONFIG.echoStrike;

class EchoStrike {
  constructor() {
    this.active = false;
    this.firstProjectile = null;
    this.secondProjectile = null;
    this.thirdProjectile = null; // Tier 2
    this.timer = 0;
    this.phase = 'idle'; // 'first' | 'converge' | 'idle'
    this.player = null;
    this.enemyPools = null;
    this.explosionTimer = 0;
    this.explosionPos = null;
    this.explosionAlpha = 0;
    this.tier = 1;
  }

  activate(player, enemyPools, tier = 1) {
    this.player = player;
    this.enemyPools = enemyPools;
    this.tier = tier;

    if (this.phase === 'first' && this.firstProjectile && this.firstProjectile.active) {
      // Second cast - fire converging projectile
      this._fireSecond(player);
      return;
    }

    // First cast
    this.active = true;
    this.timer = 0;
    this.phase = 'first';
    this.secondProjectile = null;
    this.thirdProjectile = null;
    this.explosionPos = null;
    this.explosionAlpha = 0;

    let dx = player.moveDirection.x;
    let dy = player.moveDirection.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) { dx /= len; dy /= len; }
    else { dx = 1; dy = 0; }

    this.firstProjectile = {
      x: player.x,
      y: player.y,
      vx: dx * CONFIG.projectileSpeed,
      vy: dy * CONFIG.projectileSpeed,
      active: true,
      size: 6,
      hitEnemies: new Set(),
    };
  }

  _fireSecond(player) {
    this.phase = 'converge';
    this.timer = 0;

    let dx = player.moveDirection.x;
    let dy = player.moveDirection.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) { dx /= len; dy /= len; }
    else { dx = 1; dy = 0; }

    this.secondProjectile = {
      x: player.x,
      y: player.y,
      vx: dx * CONFIG.projectileSpeed,
      vy: dy * CONFIG.projectileSpeed,
      active: true,
      size: 6,
      hitEnemies: new Set(),
    };

    // Tier 2: Auto-fire third echo from a perpendicular angle
    if (this.tier >= 2) {
      this.thirdProjectile = {
        x: player.x,
        y: player.y,
        vx: -dy * CONFIG.projectileSpeed * 0.8,
        vy: dx * CONFIG.projectileSpeed * 0.8,
        active: true,
        size: 5,
        hitEnemies: new Set(),
      };
    }
  }

  update(dt) {
    if (!this.active) return;

    this.timer += dt * 1000;

    // Update first projectile
    if (this.firstProjectile && this.firstProjectile.active) {
      this.firstProjectile.x += this.firstProjectile.vx * dt;
      this.firstProjectile.y += this.firstProjectile.vy * dt;
      this._checkHits(this.firstProjectile, CONFIG.projectileDamage);

      // Despawn if too far from origin
      if (this.firstProjectile.x < -50 || this.firstProjectile.x > 2000 ||
          this.firstProjectile.y < -50 || this.firstProjectile.y > 2000) {
        this.firstProjectile.active = false;
      }
    }

    // Update second projectile
    if (this.secondProjectile && this.secondProjectile.active) {
      this.secondProjectile.x += this.secondProjectile.vx * dt;
      this.secondProjectile.y += this.secondProjectile.vy * dt;
      this._checkHits(this.secondProjectile, CONFIG.projectileDamage);
    }

    // Tier 2: Update third projectile
    if (this.thirdProjectile && this.thirdProjectile.active) {
      this.thirdProjectile.x += this.thirdProjectile.vx * dt;
      this.thirdProjectile.y += this.thirdProjectile.vy * dt;
      this._checkHits(this.thirdProjectile, CONFIG.projectileDamage);

      // Despawn if too far
      if (this.thirdProjectile.x < -50 || this.thirdProjectile.x > 2000 ||
          this.thirdProjectile.y < -50 || this.thirdProjectile.y > 2000) {
        this.thirdProjectile.active = false;
      }
    }

    // In converge phase, check if projectiles are close enough to explode
    if (this.phase === 'converge' && this.firstProjectile && this.secondProjectile) {
      if (this.firstProjectile.active && this.secondProjectile.active) {
        // Check proximity
        const mx = (this.firstProjectile.x + this.secondProjectile.x) / 2;
        const my = (this.firstProjectile.y + this.secondProjectile.y) / 2;

        const cdx = this.firstProjectile.x - this.secondProjectile.x;
        const cdy = this.firstProjectile.y - this.secondProjectile.y;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

        if (cdist < 30 || this.timer > 2000) {
          // Converge explosion
          this._explode(mx, my);
        }
      }
    }

    // Explosion effect fade
    if (this.explosionPos) {
      this.explosionTimer += dt * 1000;
      this.explosionAlpha = Math.max(0, 1 - this.explosionTimer / 400);
      if (this.explosionAlpha <= 0) {
        this.explosionPos = null;
      }
    }

    // First cast timeout
    if (this.phase === 'first' && this.timer >= CONFIG.recastWindow) {
      if (this.firstProjectile) this.firstProjectile.active = false;
      this.phase = 'idle';
      this.active = false;
    }

    // Converge timeout
    if (this.phase === 'converge' && this.timer > 3000) {
      this.active = false;
    }

    // Cleanup
    if (this.phase === 'idle' && !this.explosionPos) {
      this.active = false;
    }
  }

  _checkHits(proj, damage) {
    if (!this.enemyPools) return;
    for (const key in this.enemyPools) {
      const enemies = this.enemyPools[key].getActive();
      for (const enemy of enemies) {
        if (!enemy.active || enemy.isPhased) continue;
        if (proj.hitEnemies.has(enemy.id)) continue;
        const dx = enemy.x - proj.x;
        const dy = enemy.y - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < proj.size + enemy.size) {
          enemy.takeDamage(damage);
          proj.hitEnemies.add(enemy.id);
        }
      }
    }
  }

  _explode(x, y) {
    if (this.firstProjectile) this.firstProjectile.active = false;
    if (this.secondProjectile) this.secondProjectile.active = false;
    if (this.thirdProjectile) this.thirdProjectile.active = false;
    this.explosionPos = { x, y };
    this.explosionTimer = 0;
    this.explosionAlpha = 1;
    this.phase = 'idle';

    // Tier 3: Pull nearby enemies inward first
    if (this.tier >= 3 && this.enemyPools) {
      const pullRadius = CONFIG.tiers[3].pullRadius;
      const pullStrength = CONFIG.tiers[3].pullStrength;
      for (const key in this.enemyPools) {
        const enemies = this.enemyPools[key].getActive();
        for (const enemy of enemies) {
          if (!enemy.active || enemy.isPhased) continue;
          const dx = x - enemy.x;
          const dy = y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pullRadius + enemy.size && dist > 5) {
            // Pull toward explosion center
            enemy.x += (dx / dist) * pullStrength * 0.1;
            enemy.y += (dy / dist) * pullStrength * 0.1;
          }
        }
      }
    }

    // AoE damage
    if (this.enemyPools) {
      for (const key in this.enemyPools) {
        const enemies = this.enemyPools[key].getActive();
        for (const enemy of enemies) {
          if (!enemy.active || enemy.isPhased) continue;
          const dx = enemy.x - x;
          const dy = enemy.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONFIG.convergeRadius + enemy.size) {
            enemy.takeDamage(CONFIG.convergeDamage);
          }
        }
      }
    }
  }

  render(ctx) {
    if (!this.active && !this.explosionPos) return;

    ctx.save();

    // First projectile
    if (this.firstProjectile && this.firstProjectile.active) {
      ctx.fillStyle = '#64ffda';
      ctx.beginPath();
      ctx.arc(this.firstProjectile.x, this.firstProjectile.y, this.firstProjectile.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Second projectile
    if (this.secondProjectile && this.secondProjectile.active) {
      ctx.fillStyle = '#ff80ab';
      ctx.beginPath();
      ctx.arc(this.secondProjectile.x, this.secondProjectile.y, this.secondProjectile.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tier 2: Third projectile
    if (this.thirdProjectile && this.thirdProjectile.active) {
      ctx.fillStyle = '#ffab40';
      ctx.beginPath();
      ctx.arc(this.thirdProjectile.x, this.thirdProjectile.y, this.thirdProjectile.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Explosion
    if (this.explosionPos && this.explosionAlpha > 0) {
      const radius = CONFIG.convergeRadius * (1 - this.explosionAlpha * 0.3);
      ctx.globalAlpha = this.explosionAlpha * 0.4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.explosionPos.x, this.explosionPos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = this.explosionAlpha;
      ctx.strokeStyle = '#64ffda';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tier 3: Pull ring visual
      if (this.tier >= 3) {
        ctx.globalAlpha = this.explosionAlpha * 0.3;
        ctx.strokeStyle = '#e040fb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.explosionPos.x, this.explosionPos.y, CONFIG.tiers[3].pullRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

export default EchoStrike;
