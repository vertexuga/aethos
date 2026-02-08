import { CRAFTED_SPELL_CONFIG } from '../../data/craftedSpellConfig.js';

const CONFIG = CRAFTED_SPELL_CONFIG.wispCompanion;

class WispCompanion {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.hp = CONFIG.wispHp;
    this.angle = 0;
    this.attackTimer = 0;
    this.player = null;
    this.enemyPools = null;
    this.projectiles = [];
    this.size = 6;
    this.tier = 1;

    // Tier 3: Second wisp
    this.x2 = 0;
    this.y2 = 0;
    this.hp2 = CONFIG.wispHp;
    this.angle2 = Math.PI; // Opposite side
    this.attackTimer2 = 0;
  }

  activate(player, enemyPools, tier = 1) {
    this.active = true;
    this.player = player;
    this.enemyPools = enemyPools;
    this.tier = tier;
    this.hp = CONFIG.wispHp;
    this.angle = 0;
    this.attackTimer = 0;
    this.projectiles = [];
    this.x = player.x + CONFIG.orbitRadius;
    this.y = player.y;

    // Tier 3: Second wisp
    if (this.tier >= 3) {
      this.hp2 = CONFIG.wispHp;
      this.angle2 = Math.PI;
      this.attackTimer2 = 500; // Stagger attacks
      this.x2 = player.x - CONFIG.orbitRadius;
      this.y2 = player.y;
    }
  }

  update(dt) {
    if (!this.active) return;

    // Orbit player
    this.angle += dt * 2.5;
    if (this.player) {
      this.x = this.player.x + Math.cos(this.angle) * CONFIG.orbitRadius;
      this.y = this.player.y + Math.sin(this.angle) * CONFIG.orbitRadius;
    }

    // Check contact damage from enemies
    if (this.enemyPools) {
      for (const key in this.enemyPools) {
        const enemies = this.enemyPools[key].getActive();
        for (const enemy of enemies) {
          if (!enemy.active || enemy.contactDamage <= 0) continue;
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < enemy.size + this.size) {
            this.hp -= enemy.contactDamage * dt * 2;
          }
        }
      }
    }

    // Tier 2: Heal player passively
    if (this.tier >= 2 && this.player && this.hp > 0) {
      const healAmount = CONFIG.tiers[2].healPerSecond * dt;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
    }

    if (this.hp <= 0) {
      // Check if tier 3 second wisp is still alive
      if (this.tier >= 3 && this.hp2 > 0) {
        // First wisp died, keep going for second
      } else {
        this.active = false;
        return;
      }
    }

    // Tier 3: Second wisp logic
    if (this.tier >= 3 && this.hp2 > 0) {
      this.angle2 += dt * 2.5;
      if (this.player) {
        this.x2 = this.player.x + Math.cos(this.angle2) * CONFIG.orbitRadius;
        this.y2 = this.player.y + Math.sin(this.angle2) * CONFIG.orbitRadius;
      }

      // Contact damage on second wisp
      if (this.enemyPools) {
        for (const key in this.enemyPools) {
          const enemies = this.enemyPools[key].getActive();
          for (const enemy of enemies) {
            if (!enemy.active || enemy.contactDamage <= 0) continue;
            const dx = enemy.x - this.x2;
            const dy = enemy.y - this.y2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < enemy.size + this.size) {
              this.hp2 -= enemy.contactDamage * dt * 2;
            }
          }
        }
      }

      // Second wisp heal (tier 2 stacks)
      if (this.tier >= 2 && this.player) {
        const healAmount = CONFIG.tiers[2].healPerSecond * dt;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
      }

      // Second wisp attack
      this.attackTimer2 += dt * 1000;
      if (this.attackTimer2 >= CONFIG.attackInterval) {
        this.attackTimer2 = 0;
        this._fireAtNearest(this.x2, this.y2);
      }

      if (this.hp2 <= 0 && this.hp <= 0) {
        this.active = false;
        return;
      }
    }

    // Auto-attack nearest enemy
    if (this.hp > 0) {
      this.attackTimer += dt * 1000;
      if (this.attackTimer >= CONFIG.attackInterval) {
        this.attackTimer = 0;
        this._fireAtNearest(this.x, this.y);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1000;

      // Check hit
      if (this.enemyPools) {
        for (const key in this.enemyPools) {
          const enemies = this.enemyPools[key].getActive();
          for (const enemy of enemies) {
            if (!enemy.active || enemy.isPhased) continue;
            const dx = enemy.x - p.x;
            const dy = enemy.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < enemy.size + 4) {
              enemy.takeDamage(CONFIG.attackDamage);
              p.life = 0;
              break;
            }
          }
          if (p.life <= 0) break;
        }
      }

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  _fireAtNearest(fromX, fromY) {
    if (!this.enemyPools) return;

    let nearest = null;
    let nearestDist = 300; // Max targeting range

    for (const key in this.enemyPools) {
      const enemies = this.enemyPools[key].getActive();
      for (const enemy of enemies) {
        if (!enemy.active || enemy.isPhased) continue;
        const dx = enemy.x - fromX;
        const dy = enemy.y - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = enemy;
        }
      }
    }

    if (nearest) {
      const dx = nearest.x - fromX;
      const dy = nearest.y - fromY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = 200;
      this.projectiles.push({
        x: fromX,
        y: fromY,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        life: 2000,
      });
    }
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();

    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);

    // Main wisp
    if (this.hp > 0) {
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#80cbc4';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Tier 2: Heal aura ring
      if (this.tier >= 2) {
        ctx.globalAlpha = 0.2 * pulse;
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Tier 3: Second wisp
    if (this.tier >= 3 && this.hp2 > 0) {
      const pulse2 = 0.7 + 0.3 * Math.sin(Date.now() / 200 + Math.PI);
      ctx.globalAlpha = pulse2;
      ctx.fillStyle = '#a5d6a7';
      ctx.beginPath();
      ctx.arc(this.x2, this.y2, this.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x2, this.y2, this.size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      if (this.tier >= 2) {
        ctx.globalAlpha = 0.2 * pulse2;
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x2, this.y2, this.size + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Projectiles
    for (const p of this.projectiles) {
      ctx.globalAlpha = Math.min(1, p.life / 500);
      ctx.fillStyle = '#b2dfdb';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default WispCompanion;
