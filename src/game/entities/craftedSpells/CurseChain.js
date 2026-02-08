import { CRAFTED_SPELL_CONFIG } from '../../data/craftedSpellConfig.js';

const CONFIG = CRAFTED_SPELL_CONFIG.curseChain;

class CurseChain {
  constructor() {
    this.active = false;
    this.timer = 0;
    this.linkedEnemies = [];
    this.enemyPools = null;
    this.tier = 1;
  }

  activate(player, enemyPools, tier = 1) {
    this.active = true;
    this.enemyPools = enemyPools;
    this.tier = tier;
    this.timer = 0;
    this.linkedEnemies = [];

    if (!enemyPools) return;

    // Find nearest enemy
    let nearest = null;
    let nearestDist = CONFIG.chainRadius;

    for (const key in enemyPools) {
      const enemies = enemyPools[key].getActive();
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = enemy;
        }
      }
    }

    if (!nearest) {
      this.active = false;
      return;
    }

    this.linkedEnemies.push(nearest);

    // Chain to nearby enemies
    for (let chain = 1; chain < CONFIG.maxTargets; chain++) {
      const lastLinked = this.linkedEnemies[this.linkedEnemies.length - 1];
      let nextNearest = null;
      let nextDist = CONFIG.chainRadius;

      for (const key in enemyPools) {
        const enemies = enemyPools[key].getActive();
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          if (this.linkedEnemies.includes(enemy)) continue;
          const dx = enemy.x - lastLinked.x;
          const dy = enemy.y - lastLinked.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < nextDist) {
            nextDist = dist;
            nextNearest = enemy;
          }
        }
      }

      if (nextNearest) {
        this.linkedEnemies.push(nextNearest);
      } else {
        break;
      }
    }

    // Hook into takeDamage for damage sharing
    for (const enemy of this.linkedEnemies) {
      const originalTakeDamage = enemy.takeDamage.bind(enemy);
      enemy._curseChainOriginalTakeDamage = enemy.takeDamage;
      enemy._curseChainLinked = this.linkedEnemies;

      enemy.takeDamage = (amount) => {
        // Take full damage normally
        originalTakeDamage(amount);

        // Share damage to other linked enemies
        const sharedDmg = amount * CONFIG.damageShare;
        for (const other of enemy._curseChainLinked) {
          if (other === enemy || !other.active) continue;
          // Use original takeDamage to avoid infinite recursion
          if (other._curseChainOriginalTakeDamage) {
            other._curseChainOriginalTakeDamage(sharedDmg);
          }
        }
      };

      // Tier 2: Slow linked enemies
      if (this.tier >= 2) {
        const slowAmount = CONFIG.tiers[2].slowAmount;
        enemy._curseChainOriginalSpeed = enemy.speed;
        if (enemy.speed) {
          enemy.speed *= (1 - slowAmount);
        }
      }
    }
  }

  update(dt) {
    if (!this.active) return;

    this.timer += dt * 1000;

    // Remove dead enemies from links
    const prevCount = this.linkedEnemies.length;
    this.linkedEnemies = this.linkedEnemies.filter(e => e.active);

    // Tier 3: Deal burst damage when a chain link breaks (enemy died)
    if (this.tier >= 3 && this.linkedEnemies.length < prevCount) {
      const brokeLinkCount = prevCount - this.linkedEnemies.length;
      const burstDamage = CONFIG.tiers[3].breakDamage * brokeLinkCount;
      for (const enemy of this.linkedEnemies) {
        if (!enemy.active) continue;
        if (enemy._curseChainOriginalTakeDamage) {
          enemy._curseChainOriginalTakeDamage(burstDamage);
        }
      }
    }

    // End if no enemies left or duration expired
    if (this.linkedEnemies.length === 0 || this.timer >= CONFIG.duration) {
      this.deactivate();
    }
  }

  deactivate() {
    // Tier 3: Final burst damage on all remaining linked enemies when chain ends
    if (this.tier >= 3 && this.linkedEnemies.length > 1) {
      const burstDamage = CONFIG.tiers[3].breakDamage;
      for (const enemy of this.linkedEnemies) {
        if (!enemy.active) continue;
        if (enemy._curseChainOriginalTakeDamage) {
          enemy._curseChainOriginalTakeDamage(burstDamage);
        }
      }
    }

    // Restore original takeDamage and speed
    for (const enemy of this.linkedEnemies) {
      if (enemy._curseChainOriginalTakeDamage) {
        enemy.takeDamage = enemy._curseChainOriginalTakeDamage;
        delete enemy._curseChainOriginalTakeDamage;
        delete enemy._curseChainLinked;
      }

      // Tier 2: Restore speed
      if (this.tier >= 2 && enemy._curseChainOriginalSpeed !== undefined) {
        enemy.speed = enemy._curseChainOriginalSpeed;
        delete enemy._curseChainOriginalSpeed;
      }
    }
    this.linkedEnemies = [];
    this.active = false;
  }

  render(ctx) {
    if (!this.active || this.linkedEnemies.length < 1) return;

    const fadeAlpha = this.timer > CONFIG.duration - 1000
      ? (CONFIG.duration - this.timer) / 1000
      : 1;

    ctx.save();

    // Draw chain beams between linked enemies
    ctx.strokeStyle = '#ce93d8';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7 * fadeAlpha;

    for (let i = 0; i < this.linkedEnemies.length - 1; i++) {
      const a = this.linkedEnemies[i];
      const b = this.linkedEnemies[i + 1];
      if (!a.active || !b.active) continue;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Draw curse marks on linked enemies
    ctx.globalAlpha = 0.4 * fadeAlpha;
    ctx.fillStyle = '#e040fb';
    for (const enemy of this.linkedEnemies) {
      if (!enemy.active) continue;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size + 4, 0, Math.PI * 2);
      ctx.fill();

      // Tier 2: Slow indicator (blue tint)
      if (this.tier >= 2) {
        ctx.globalAlpha = 0.2 * fadeAlpha;
        ctx.fillStyle = '#42a5f5';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e040fb';
        ctx.globalAlpha = 0.4 * fadeAlpha;
      }
    }

    ctx.restore();
  }
}

export default CurseChain;
