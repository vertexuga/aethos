import { STRUCTURE_TYPES, getStructureTierConfig } from '../data/structureConfig.js';

class Structure {
  static idCounter = 0;

  constructor() {
    this.id = `structure_${Structure.idCounter++}`;
    this.x = 0;
    this.y = 0;
    this.active = false;
    this.built = false; // starts unbuilt — player must spend materials
    this.type = '';
    this.config = null;
    this.hp = 0;
    this.maxHp = 0;
    this.size = 16;
    this.tier = 1;

    // Turret state
    this.attackTimer = 0;
    this.turretAngle = 0;
    this.turretBullets = [];

    // Tier-derived stats (set by applyTierStats)
    this.attackRange = 0;
    this.attackDamage = 0;
    this.attackCooldown = 0;
    this.bulletSpeed = 0;
    this.barrels = 1;
    this.auraRadius = 0;
    this.manaRegenBoost = 0;
    this.damageReduction = 0;

    // Animation
    this.auraPhase = Math.random() * Math.PI * 2;
  }

  reset({ x, y, type }) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.config = STRUCTURE_TYPES[type];
    this.tier = 1;
    this.size = this.config.size;
    this.active = true;
    this.built = false; // unbuilt by default
    this.attackTimer = 0;
    this.turretBullets = [];
    this.auraPhase = Math.random() * Math.PI * 2;

    // Apply tier 1 stats
    this.applyTierStats();

    this.hp = 0;
  }

  applyTierStats() {
    const tierConfig = getStructureTierConfig(this.type, this.tier);
    if (!tierConfig) return;

    this.maxHp = tierConfig.hp;
    this.attackRange = tierConfig.attackRange || 0;
    this.attackDamage = tierConfig.attackDamage || 0;
    this.attackCooldown = tierConfig.attackCooldown || 0;
    this.bulletSpeed = tierConfig.bulletSpeed || 300;
    this.barrels = tierConfig.barrels || 1;
    this.auraRadius = tierConfig.auraRadius || 0;
    this.manaRegenBoost = tierConfig.manaRegenBoost || 0;
    this.damageReduction = tierConfig.damageReduction || 0;
  }

  getMaxTier() {
    if (this.config.maxTier !== undefined) return this.config.maxTier;
    if (this.config.tiers) return Math.max(...Object.keys(this.config.tiers).map(Number));
    return 1;
  }

  canUpgrade() {
    return this.built && this.tier < this.getMaxTier();
  }

  getUpgradeCost() {
    if (!this.config.upgradeCost) return null;
    return this.config.upgradeCost[this.tier + 1] || null;
  }

  upgradeTier() {
    if (!this.canUpgrade()) return false;
    this.tier++;
    this.applyTierStats();
    // Heal to new max HP on upgrade
    this.hp = this.maxHp;
    return true;
  }

  build() {
    this.built = true;
    this.applyTierStats();
    this.hp = this.maxHp;
  }

  takeDamage(amount) {
    if (!this.built) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.built = false;
      this.hp = 0;
    }
  }

  repair() {
    if (!this.active || !this.built) return;
    this.hp = this.maxHp;
  }

  update(dt, enemyPools) {
    if (!this.active) return;

    this.auraPhase += dt * 2;

    if (!this.built) return; // unbuilt structures don't do anything

    if (this.type === 'arcaneTurret') {
      this.updateTurret(dt, enemyPools);
    }
  }

  updateTurret(dt, enemyPools) {
    this.attackTimer += dt * 1000;

    // Update bullets
    for (let i = this.turretBullets.length - 1; i >= 0; i--) {
      const b = this.turretBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Check bullet-enemy collision
      if (enemyPools) {
        for (const key in enemyPools) {
          for (const enemy of enemyPools[key].getActive()) {
            if (!enemy.active) continue;
            if (enemy.isPhased) continue;
            const edx = enemy.x - b.x;
            const edy = enemy.y - b.y;
            if (edx * edx + edy * edy < (enemy.size + 3) * (enemy.size + 3)) {
              enemy.takeDamage(this.attackDamage);
              b.life = 0;
              break;
            }
          }
          if (b.life <= 0) break;
        }
      }

      if (b.life <= 0) this.turretBullets.splice(i, 1);
    }

    if (this.attackTimer < this.attackCooldown) return;

    if (!enemyPools) return;

    // Tier 3: find up to 3 unique nearest enemies, fire 1 bullet at each
    if (this.barrels >= 3) {
      const targets = this.findNearestEnemies(enemyPools, 3);
      if (targets.length > 0) {
        this.attackTimer = 0;
        // Point turret at first target
        const first = targets[0];
        this.turretAngle = Math.atan2(first.y - this.y, first.x - this.x);

        for (const target of targets) {
          this.fireBulletAt(target, 0);
        }
      }
      return;
    }

    // Tier 1 & 2: find single nearest enemy
    const nearest = this.findNearestEnemy(enemyPools);
    if (!nearest) return;

    this.attackTimer = 0;
    const edx = nearest.x - this.x;
    const edy = nearest.y - this.y;
    this.turretAngle = Math.atan2(edy, edx);

    if (this.barrels >= 2) {
      // Tier 2: fire 2 bullets with ±5° spread at same target
      this.fireBulletAt(nearest, 5 * Math.PI / 180);
      this.fireBulletAt(nearest, -5 * Math.PI / 180);
    } else {
      // Tier 1: single bullet
      this.fireBulletAt(nearest, 0);
    }
  }

  findNearestEnemy(enemyPools) {
    let nearest = null;
    let nearestDist = this.attackRange;

    for (const key in enemyPools) {
      for (const enemy of enemyPools[key].getActive()) {
        if (!enemy.active || enemy.isPhased) continue;
        const edx = enemy.x - this.x;
        const edy = enemy.y - this.y;
        const dist = Math.sqrt(edx * edx + edy * edy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = enemy;
        }
      }
    }
    return nearest;
  }

  findNearestEnemies(enemyPools, count) {
    const candidates = [];
    for (const key in enemyPools) {
      for (const enemy of enemyPools[key].getActive()) {
        if (!enemy.active || enemy.isPhased) continue;
        const edx = enemy.x - this.x;
        const edy = enemy.y - this.y;
        const dist = Math.sqrt(edx * edx + edy * edy);
        if (dist < this.attackRange) {
          candidates.push({ enemy, dist });
        }
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);
    return candidates.slice(0, count).map(c => c.enemy);
  }

  fireBulletAt(target, spreadAngle) {
    const edx = target.x - this.x;
    const edy = target.y - this.y;
    const dist = Math.sqrt(edx * edx + edy * edy);
    if (dist < 0.01) return;

    let angle = Math.atan2(edy, edx) + spreadAngle;

    this.turretBullets.push({
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * this.bulletSpeed,
      vy: Math.sin(angle) * this.bulletSpeed,
      life: 1.0,
    });
  }

  isPlayerInAura(player) {
    if (!this.active || !this.built) return false;
    if (!this.auraRadius) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return (dx * dx + dy * dy) < this.auraRadius * this.auraRadius;
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    const pulse = 0.5 + 0.3 * Math.sin(this.auraPhase);

    // Ghost/unbuilt rendering
    if (!this.built) {
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(this.auraPhase);

      // Ghost hexagonal outline
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const hx = this.x + Math.cos(angle) * this.size;
        const hy = this.y + Math.sin(angle) * this.size;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = this.config.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ghost type icon (faded)
      this.renderTypeIcon(ctx);

      ctx.restore();
      return;
    }

    // Aura ring (only when built)
    if (this.auraRadius) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.auraRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${this.type === 'manaWell' ? '66, 165, 245' : '102, 187, 106'}, ${0.08 + pulse * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Hexagonal base
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const hx = this.x + Math.cos(angle) * this.size;
      const hy = this.y + Math.sin(angle) * this.size;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(20, 25, 40, 0.8)';
    ctx.fill();
    ctx.strokeStyle = this.config.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    this.renderTypeIcon(ctx);

    // Turret bullets
    for (const b of this.turretBullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8a65';
      ctx.fill();
    }

    // Health bar (only when damaged)
    if (this.hp < this.maxHp) {
      const barWidth = 30;
      const barHeight = 4;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.size - 10;
      const hpPercent = this.hp / this.maxHp;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const barColor = hpPercent > 0.6 ? '#4caf50' : hpPercent > 0.3 ? '#ffc107' : '#f44336';
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }

    // Tier badge (below structure)
    if (this.tier > 1 || this.getMaxTier() > 1) {
      const tierLabels = { 1: 'I', 2: 'II', 3: 'III' };
      const label = tierLabels[this.tier] || this.tier.toString();
      ctx.fillStyle = this.tier >= 3 ? '#ffd700' : this.tier >= 2 ? '#c0c0c0' : 'rgba(200,200,200,0.6)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, this.x, this.y + this.size + 10);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }

  renderTypeIcon(ctx) {
    if (this.type === 'arcaneTurret') {
      // Render barrel(s) based on tier
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.turretAngle);
      ctx.fillStyle = this.config.color;

      if (this.barrels >= 3) {
        // 3 barrels: spread out
        ctx.fillRect(0, -5, this.size * 0.8, 3);
        ctx.fillRect(0, -1.5, this.size * 0.8, 3);
        ctx.fillRect(0, 2, this.size * 0.8, 3);
      } else if (this.barrels >= 2) {
        // 2 barrels
        ctx.fillRect(0, -4, this.size * 0.8, 3);
        ctx.fillRect(0, 1, this.size * 0.8, 3);
      } else {
        // 1 barrel
        ctx.fillRect(0, -2.5, this.size * 0.8, 5);
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = this.config.color;
      ctx.fill();
    } else if (this.type === 'manaWell') {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 7);
      ctx.quadraticCurveTo(this.x + 6, this.y + 2, this.x, this.y + 7);
      ctx.quadraticCurveTo(this.x - 6, this.y + 2, this.x, this.y - 7);
      ctx.fillStyle = this.config.color;
      ctx.fill();
    } else if (this.type === 'shieldPylon') {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 8);
      ctx.lineTo(this.x + 7, this.y - 3);
      ctx.lineTo(this.x + 5, this.y + 5);
      ctx.lineTo(this.x, this.y + 8);
      ctx.lineTo(this.x - 5, this.y + 5);
      ctx.lineTo(this.x - 7, this.y - 3);
      ctx.closePath();
      ctx.fillStyle = this.config.color;
      ctx.fill();
    } else if (this.type === 'voidChest') {
      // Chest body
      ctx.fillStyle = this.config.color;
      ctx.fillRect(this.x - 7, this.y - 4, 14, 10);
      // Chest lid (trapezoid top)
      ctx.beginPath();
      ctx.moveTo(this.x - 8, this.y - 4);
      ctx.lineTo(this.x - 6, this.y - 8);
      ctx.lineTo(this.x + 6, this.y - 8);
      ctx.lineTo(this.x + 8, this.y - 4);
      ctx.closePath();
      ctx.fillStyle = '#9575cd';
      ctx.fill();
      // Void swirl center
      ctx.beginPath();
      ctx.arc(this.x, this.y + 1, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a2e';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x, this.y + 1, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#b388ff';
      ctx.fill();
    }
  }
}

export default Structure;
