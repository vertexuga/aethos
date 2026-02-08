import { CRAFTED_SPELL_CONFIG } from '../../data/craftedSpellConfig.js';

const CONFIG = CRAFTED_SPELL_CONFIG.phantomDecoy;

class PhantomDecoy {
  constructor() {
    this.active = false;
    this.decoy = null;
    this.timer = 0;
    this.duration = CONFIG.duration;
    this.player = null;
    this.enemyPools = null;
    this.tier = 1;
    this._originalSpeed = 0;
  }

  activate(player, enemyPools, tier = 1) {
    this.active = true;
    this.player = player;
    this.enemyPools = enemyPools;
    this.tier = tier;
    this.timer = 0;

    // Create decoy at player position
    this.decoy = {
      x: player.x,
      y: player.y,
      hp: CONFIG.decoyHp,
      maxHp: CONFIG.decoyHp,
      size: player.size,
      color: player.color,
      active: true,
      isDecoy: true,
    };

    // Make player invisible
    this.player._phantomInvisible = true;
    this.player._invisAlpha = CONFIG.invisAlpha;

    // Tier 3: Speed boost during invisibility
    if (this.tier >= 3) {
      this._originalSpeed = this.player.speed;
      this.player.speed *= (1 + CONFIG.tiers[3].speedBoost);
    }

    // Redirect enemies to target decoy
    this._redirectEnemies(true);
  }

  _redirectEnemies(toDecoy) {
    if (!this.enemyPools) return;
    for (const key in this.enemyPools) {
      const enemies = this.enemyPools[key].getActive();
      for (const enemy of enemies) {
        if (toDecoy && this.decoy && this.decoy.active) {
          enemy._originalPlayer = enemy.player;
          enemy.player = this.decoy;
        } else if (enemy._originalPlayer) {
          enemy.player = enemy._originalPlayer;
          delete enemy._originalPlayer;
        }
      }
    }
  }

  update(dt) {
    if (!this.active) return;

    this.timer += dt * 1000;

    // Check decoy HP (enemies can damage it via collision system)
    if (this.decoy && this.decoy.active) {
      // Check for enemy contact damage on decoy
      if (this.enemyPools) {
        for (const key in this.enemyPools) {
          const enemies = this.enemyPools[key].getActive();
          for (const enemy of enemies) {
            if (!enemy.active || enemy.contactDamage <= 0) continue;
            const dx = enemy.x - this.decoy.x;
            const dy = enemy.y - this.decoy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < enemy.size + this.decoy.size) {
              this.decoy.hp -= enemy.contactDamage * dt;
            }
          }
        }
      }

      if (this.decoy.hp <= 0) {
        this.decoy.active = false;

        // Tier 2: Decoy explodes on death
        if (this.tier >= 2) {
          this._decoyExplode();
        }
      }
    }

    // End when timer expires
    if (this.timer >= this.duration) {
      // If decoy still alive at expiry and tier 2+, also explode
      if (this.tier >= 2 && this.decoy && this.decoy.active) {
        this._decoyExplode();
      }
      this.deactivate();
    }
  }

  _decoyExplode() {
    if (!this.decoy || !this.enemyPools) return;
    const tierData = CONFIG.tiers[2];
    const { decoyExplosionDamage, decoyExplosionRadius } = tierData;

    for (const key in this.enemyPools) {
      const enemies = this.enemyPools[key].getActive();
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        if (enemy.isPhased) continue;
        const dx = enemy.x - this.decoy.x;
        const dy = enemy.y - this.decoy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < decoyExplosionRadius + enemy.size) {
          enemy.takeDamage(decoyExplosionDamage);
        }
      }
    }

    // Store explosion for rendering
    this._explosionPos = { x: this.decoy.x, y: this.decoy.y };
    this._explosionTimer = 0;
  }

  deactivate() {
    if (this.player) {
      this.player._phantomInvisible = false;
      delete this.player._invisAlpha;

      // Tier 3: Restore original speed
      if (this.tier >= 3 && this._originalSpeed > 0) {
        this.player.speed = this._originalSpeed;
        this._originalSpeed = 0;
      }
    }
    this._redirectEnemies(false);
    this.active = false;
    this.decoy = null;
  }

  render(ctx) {
    if (!this.active && !this._explosionPos) return;

    ctx.save();

    // Render decoy explosion (tier 2+)
    if (this._explosionPos) {
      this._explosionTimer = (this._explosionTimer || 0) + 16; // approximate
      const alpha = Math.max(0, 1 - this._explosionTimer / 400);
      if (alpha > 0) {
        const radius = CONFIG.tiers[2].decoyExplosionRadius * (1 - alpha * 0.3);
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.arc(this._explosionPos.x, this._explosionPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        this._explosionPos = null;
      }
    }

    if (!this.active || !this.decoy || !this.decoy.active) {
      ctx.restore();
      return;
    }

    // Draw decoy with pulsing effect
    const pulse = 0.6 + 0.3 * Math.sin(this.timer / 200);
    ctx.globalAlpha = pulse;

    ctx.beginPath();
    ctx.arc(this.decoy.x, this.decoy.y, this.decoy.size, 0, Math.PI * 2);
    ctx.fillStyle = this.decoy.color;
    ctx.fill();

    // Decoy health bar
    const barWidth = 30;
    const barHeight = 3;
    const barX = this.decoy.x - barWidth / 2;
    const barY = this.decoy.y - this.decoy.size - 8;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(barX, barY, barWidth * (this.decoy.hp / this.decoy.maxHp), barHeight);

    // Tier 2 indicator: bomb icon below decoy
    if (this.tier >= 2) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#ff6b35';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('*', this.decoy.x, this.decoy.y + this.decoy.size + 10);
    }

    ctx.restore();
  }
}

export default PhantomDecoy;
