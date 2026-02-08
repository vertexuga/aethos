import { CRAFTED_SPELL_CONFIG } from '../../data/craftedSpellConfig.js';

const CONFIG = CRAFTED_SPELL_CONFIG.stasisField;

class StasisField {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.timer = 0;
    this.frozenEnemies = [];
    this.enemyPools = null;
    this.expandProgress = 0;
    this.tier = 1;
  }

  activate(player, enemyPools, tier = 1) {
    this.active = true;
    this.enemyPools = enemyPools;
    this.tier = tier;
    this.timer = 0;
    this.expandProgress = 0;
    this.frozenEnemies = [];

    // Place at player position
    this.x = player.x;
    this.y = player.y;

    // Freeze enemies in radius
    if (enemyPools) {
      for (const key in enemyPools) {
        const enemies = enemyPools[key].getActive();
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONFIG.radius + enemy.size) {
            enemy._frozen = true;
            enemy._frozenVx = enemy.vx;
            enemy._frozenVy = enemy.vy;
            enemy.vx = 0;
            enemy.vy = 0;
            // Store original update
            enemy._frozenUpdate = enemy.update;
            enemy.update = function() {}; // Freeze by disabling update
            // Store HP at freeze time for tier 3 shatter check
            enemy._frozenHpRatio = enemy.hp / enemy.maxHp;

            // Tier 2: Make frozen enemies take more damage
            if (this.tier >= 2) {
              const origTakeDamage = enemy.takeDamage.bind(enemy);
              enemy._frozenOrigTakeDamage = enemy.takeDamage;
              enemy.takeDamage = (amount) => {
                origTakeDamage(amount * CONFIG.tiers[2].damageMultiplier);
              };
            }

            this.frozenEnemies.push(enemy);
          }
        }
      }
    }
  }

  update(dt) {
    if (!this.active) return;

    this.timer += dt * 1000;
    this.expandProgress = Math.min(1, this.timer / 200);

    // Unfreeze when duration expires
    if (this.timer >= CONFIG.duration) {
      this.deactivate();
    }

    // Unfreeze dead enemies
    for (let i = this.frozenEnemies.length - 1; i >= 0; i--) {
      if (!this.frozenEnemies[i].active) {
        this._unfreezeEnemy(this.frozenEnemies[i]);
        this.frozenEnemies.splice(i, 1);
      }
    }
  }

  _unfreezeEnemy(enemy) {
    if (enemy._frozen) {
      enemy._frozen = false;
      if (enemy._frozenUpdate) {
        enemy.update = enemy._frozenUpdate;
        delete enemy._frozenUpdate;
      }
      if (enemy._frozenVx !== undefined) {
        enemy.vx = enemy._frozenVx;
        enemy.vy = enemy._frozenVy;
        delete enemy._frozenVx;
        delete enemy._frozenVy;
      }
      // Tier 2: Restore original takeDamage
      if (enemy._frozenOrigTakeDamage) {
        enemy.takeDamage = enemy._frozenOrigTakeDamage;
        delete enemy._frozenOrigTakeDamage;
      }
      delete enemy._frozenHpRatio;
    }
  }

  deactivate() {
    // Tier 3: Shatter - instantly kill enemies below threshold
    if (this.tier >= 3) {
      const threshold = CONFIG.tiers[3].shatterThreshold;
      for (const enemy of this.frozenEnemies) {
        if (!enemy.active) continue;
        const hpRatio = enemy.hp / enemy.maxHp;
        if (hpRatio <= threshold) {
          enemy.takeDamage(enemy.hp + 1); // Kill instantly
        }
      }
    }

    // Unfreeze all
    for (const enemy of this.frozenEnemies) {
      this._unfreezeEnemy(enemy);
    }
    this.frozenEnemies = [];
    this.active = false;
  }

  render(ctx) {
    if (!this.active) return;

    const radius = CONFIG.radius * this.expandProgress;
    const fadeAlpha = this.timer > CONFIG.duration - 500
      ? (CONFIG.duration - this.timer) / 500
      : 1;

    ctx.save();
    ctx.globalAlpha = 0.2 * fadeAlpha;

    // Field circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#64b5f6';
    ctx.fill();

    // Edge ring
    ctx.globalAlpha = 0.5 * fadeAlpha;
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Frozen enemy tint
    ctx.globalAlpha = 0.3 * fadeAlpha;
    for (const enemy of this.frozenEnemies) {
      if (!enemy.active) continue;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size + 3, 0, Math.PI * 2);
      ctx.fillStyle = '#42a5f5';
      ctx.fill();

      // Tier 3: Show shatter warning on low HP enemies
      if (this.tier >= 3) {
        const hpRatio = enemy.hp / enemy.maxHp;
        if (hpRatio <= CONFIG.tiers[3].shatterThreshold) {
          ctx.globalAlpha = 0.6 * fadeAlpha * (0.5 + 0.5 * Math.sin(this.timer / 100));
          ctx.strokeStyle = '#ff1744';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size + 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.3 * fadeAlpha;
        }
      }
    }

    ctx.restore();
  }
}

export default StasisField;
