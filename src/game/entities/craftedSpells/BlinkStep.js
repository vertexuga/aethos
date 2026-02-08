import { CRAFTED_SPELL_CONFIG } from '../../data/craftedSpellConfig.js';

const CONFIG = CRAFTED_SPELL_CONFIG.blinkStep;

class BlinkStep {
  constructor() {
    this.active = false;
    this.afterimage = null;
    this.timer = 0;
    this.explosionTimer = 0;
    this.exploded = false;
    this.player = null;
    this.enemyPools = null;
    this.tier = 1;
    this.trail = []; // Tier 2: damaging trail points
    this.trailTimer = 0;
    this.killedByExplosion = false;
    this.craftedSpellCaster = null; // Set externally for tier 3 cooldown reset
  }

  activate(player, enemyPools, tier = 1) {
    this.player = player;
    this.enemyPools = enemyPools;
    this.tier = tier;
    this.active = true;
    this.timer = 0;
    this.explosionTimer = 0;
    this.exploded = false;
    this.trail = [];
    this.trailTimer = 0;
    this.killedByExplosion = false;

    // Store afterimage at original position
    const origX = player.x;
    const origY = player.y;

    // Teleport player in movement direction (or right if stationary)
    let dx = player.moveDirection.x;
    let dy = player.moveDirection.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    } else {
      dx = 1;
      dy = 0;
    }

    player.x += dx * CONFIG.teleportDistance;
    player.y += dy * CONFIG.teleportDistance;

    // Clamp to canvas bounds
    if (player.canvasWidth > 0) {
      player.x = Math.max(player.size, Math.min(player.canvasWidth - player.size, player.x));
    }
    if (player.canvasHeight > 0) {
      player.y = Math.max(player.size, Math.min(player.canvasHeight - player.size, player.y));
    }

    this.afterimage = {
      x: origX,
      y: origY,
      alpha: 1,
      size: player.size,
      color: player.color,
    };

    // Tier 2: Create trail between origin and destination
    if (this.tier >= 2) {
      const steps = 8;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        this.trail.push({
          x: origX + (player.x - origX) * t,
          y: origY + (player.y - origY) * t,
          active: true,
        });
      }
      this.trailTimer = CONFIG.tiers[2].trailDuration;
    }
  }

  update(dt) {
    if (!this.active) return;

    this.timer += dt * 1000;

    if (this.afterimage && !this.exploded) {
      this.explosionTimer += dt * 1000;

      if (this.explosionTimer >= CONFIG.explosionDelay) {
        // Explode: damage nearby enemies
        this.exploded = true;
        if (this.enemyPools) {
          for (const key in this.enemyPools) {
            const enemies = this.enemyPools[key].getActive();
            for (const enemy of enemies) {
              if (!enemy.active) continue;
              if (enemy.isPhased) continue;
              const edx = enemy.x - this.afterimage.x;
              const edy = enemy.y - this.afterimage.y;
              const dist = Math.sqrt(edx * edx + edy * edy);
              if (dist < CONFIG.explosionRadius + enemy.size) {
                const hpBefore = enemy.hp;
                enemy.takeDamage(CONFIG.explosionDamage);
                // Tier 3: Check if explosion killed an enemy
                if (this.tier >= 3 && enemy.hp <= 0 && hpBefore > 0) {
                  this.killedByExplosion = true;
                }
              }
            }
          }
        }

        // Tier 3: Reset cooldown if explosion killed an enemy
        if (this.tier >= 3 && this.killedByExplosion && this.craftedSpellCaster) {
          this.craftedSpellCaster.resetCooldown('blinkStep');
        }
      }
    }

    // Tier 2: Damaging trail
    if (this.tier >= 2 && this.trailTimer > 0) {
      this.trailTimer -= dt * 1000;
      const trailDps = CONFIG.tiers[2].trailDamage;

      if (this.enemyPools) {
        for (const point of this.trail) {
          if (!point.active) continue;
          for (const key in this.enemyPools) {
            const enemies = this.enemyPools[key].getActive();
            for (const enemy of enemies) {
              if (!enemy.active || enemy.isPhased) continue;
              const dx = enemy.x - point.x;
              const dy = enemy.y - point.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 15 + enemy.size) {
                enemy.takeDamage(trailDps * dt);
              }
            }
          }
        }
      }

      if (this.trailTimer <= 0) {
        this.trail = [];
      }
    }

    // Fade out afterimage after explosion
    if (this.exploded && this.afterimage) {
      this.afterimage.alpha -= dt * 3;
      if (this.afterimage.alpha <= 0) {
        if (this.trail.length === 0) {
          this.active = false;
        }
        this.afterimage = null;
      }
    }

    // Safety timeout
    if (this.timer > 3000 && this.trail.length === 0) {
      this.active = false;
      this.afterimage = null;
    }
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // Tier 2: Render trail
    if (this.tier >= 2 && this.trail.length > 0 && this.trailTimer > 0) {
      const trailAlpha = Math.min(1, this.trailTimer / 500);
      ctx.globalAlpha = 0.4 * trailAlpha;
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.stroke();
    }

    if (this.afterimage) {
      if (this.exploded) {
        // Explosion ring
        const expandProgress = Math.min(1, (this.timer - CONFIG.explosionDelay) / 300);
        const radius = CONFIG.explosionRadius * expandProgress;
        ctx.globalAlpha = this.afterimage.alpha * 0.6;
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.afterimage.x, this.afterimage.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Fill
        ctx.globalAlpha = this.afterimage.alpha * 0.2;
        ctx.fillStyle = '#ff6b35';
        ctx.fill();
      } else {
        // Afterimage (ghostly player shape)
        const flicker = 0.5 + 0.3 * Math.sin(this.timer / 50);
        ctx.globalAlpha = flicker;
        ctx.beginPath();
        ctx.arc(this.afterimage.x, this.afterimage.y, this.afterimage.size, 0, Math.PI * 2);
        ctx.fillStyle = this.afterimage.color;
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

export default BlinkStep;
