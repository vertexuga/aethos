import { CRYSTAL_CONFIG } from '../data/crystalConfig.js';

class Crystal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = CRYSTAL_CONFIG.size;
    this.maxHp = CRYSTAL_CONFIG.maxHp;
    this.hp = CRYSTAL_CONFIG.hp;
    this.color = CRYSTAL_CONFIG.color;
    this.active = true;

    // Warning system
    this.warningRadius = CRYSTAL_CONFIG.warningRadius;
    this.isUnderAttack = false;

    // Upgrades
    this.upgradeLevels = { fortify: 0, regen: 0, earlyWarning: 0 };
    this.regenRate = 0; // HP/sec

    // Inferno tower attack
    this.targets = [];
    this.beamPhase = 0;

    // Low HP warning
    this.isLowHP = false;

    // Visual animation
    this.pulsePhase = 0;
    this.damageFlash = 0;
    this.particles = [];
  }

  upgrade(type) {
    const config = CRYSTAL_CONFIG.upgrades[type];
    if (!config) return false;

    const currentTier = this.upgradeLevels[type];
    const nextTier = currentTier + 1;
    if (nextTier > config.maxTier) return false;

    this.upgradeLevels[type] = nextTier;
    const tierData = config.tiers[nextTier];

    if (type === 'fortify') {
      this.maxHp = CRYSTAL_CONFIG.maxHp + tierData.hpBonus;
      this.hp = Math.min(this.hp + tierData.hpBonus, this.maxHp);
    } else if (type === 'regen') {
      this.regenRate = tierData.regenRate;
    } else if (type === 'earlyWarning') {
      this.warningRadius = CRYSTAL_CONFIG.warningRadius + tierData.radiusBonus;
    }

    return true;
  }

  takeDamage(amount) {
    if (!this.active) return;
    this.hp = Math.max(0, this.hp - amount);
    this.damageFlash = 0.3;
    if (this.hp <= 0) {
      this.active = false;
    }
  }

  checkWarning(enemyPools) {
    this.isUnderAttack = false;
    for (const key in enemyPools) {
      for (const enemy of enemyPools[key].getActive()) {
        if (!enemy.active) continue;
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        if (dx * dx + dy * dy < this.warningRadius * this.warningRadius) {
          this.isUnderAttack = true;
          return;
        }
      }
    }
  }

  update(dt, enemyPools) {
    if (!this.active) return;

    this.pulsePhase += dt * 2;
    this.beamPhase += dt * 4;

    // Low HP check
    this.isLowHP = this.hp / this.maxHp < 0.25;

    // Passive HP recovery
    if (CRYSTAL_CONFIG.maxHpGrowth > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + CRYSTAL_CONFIG.maxHpGrowth * dt);
    }

    // HP regen
    if (this.regenRate > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
    }

    // Damage flash decay
    if (this.damageFlash > 0) {
      this.damageFlash -= dt * 2;
      if (this.damageFlash < 0) this.damageFlash = 0;
    }

    // Inferno tower attack
    this.targets = [];
    if (enemyPools) {
      const candidates = [];
      for (const key in enemyPools) {
        for (const enemy of enemyPools[key].getActive()) {
          if (!enemy.active) continue;
          if (enemy.isPhased) continue;
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CRYSTAL_CONFIG.attackRange) {
            candidates.push({ enemy, dist });
          }
        }
      }
      candidates.sort((a, b) => a.dist - b.dist);
      const maxTargets = Math.min(CRYSTAL_CONFIG.maxTargets, candidates.length);
      for (let i = 0; i < maxTargets; i++) {
        const target = candidates[i].enemy;
        target.takeDamage(CRYSTAL_CONFIG.attackDPS * dt);
        this.targets.push(target);
      }
    }

    // Ambient particles (reduced rate for perf)
    if (Math.random() < 0.15) {
      const angle = Math.random() * Math.PI * 2;
      const dist = this.size * 0.5 + Math.random() * this.size;
      this.particles.push({
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        vy: -15 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 10,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 0.8 + Math.random() * 0.6,
        size: 1 + Math.random() * 2,
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    const pulse = this.isLowHP
      ? 0.5 + 0.5 * Math.sin(this.pulsePhase * 3)
      : 0.5 + 0.3 * Math.sin(this.pulsePhase);
    const time = this.pulsePhase;

    // Ambient particles
    for (const p of this.particles) {
      const alpha = (p.life / p.maxLife) * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = this.isLowHP
        ? `rgba(255, 60, 60, ${alpha})`
        : `rgba(0, 229, 255, ${alpha})`;
      ctx.fill();
    }

    // Pulsing aura
    const auraRadius = this.size * 2 + Math.sin(time * 1.5) * 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, auraRadius, 0, Math.PI * 2);
    const auraGrad = ctx.createRadialGradient(
      this.x, this.y, this.size,
      this.x, this.y, auraRadius
    );
    if (this.isLowHP) {
      auraGrad.addColorStop(0, `rgba(255, 50, 50, ${0.2 * pulse})`);
      auraGrad.addColorStop(1, 'rgba(255, 50, 50, 0)');
    } else {
      auraGrad.addColorStop(0, `rgba(0, 229, 255, ${0.15 * pulse})`);
      auraGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    }
    ctx.fillStyle = auraGrad;
    ctx.fill();

    // Damage flash overlay
    if (this.damageFlash > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 50, 50, ${this.damageFlash * 0.3})`;
      ctx.fill();
    }

    // Crystal body (diamond shape)
    const s = this.size;

    // Body glow (cheap circle behind instead of shadowBlur)
    ctx.beginPath();
    ctx.arc(this.x, this.y, s * 1.5, 0, Math.PI * 2);
    const glowColor = this.damageFlash > 0 ? 'rgba(255,80,80,0.15)' : (this.isLowHP ? 'rgba(255,50,50,0.12)' : 'rgba(0,229,255,0.12)');
    ctx.fillStyle = glowColor;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - s * 1.3);    // top
    ctx.lineTo(this.x + s * 0.8, this.y);     // right
    ctx.lineTo(this.x, this.y + s * 0.8);     // bottom
    ctx.lineTo(this.x - s * 0.8, this.y);     // left
    ctx.closePath();

    // Gradient fill
    const fillGrad = ctx.createLinearGradient(
      this.x - s, this.y - s * 1.3,
      this.x + s, this.y + s
    );
    if (this.isLowHP) {
      fillGrad.addColorStop(0, '#ff8a80');
      fillGrad.addColorStop(0.4, '#f44336');
      fillGrad.addColorStop(1, '#b71c1c');
    } else {
      fillGrad.addColorStop(0, '#80deea');
      fillGrad.addColorStop(0.4, this.color);
      fillGrad.addColorStop(1, '#0097a7');
    }
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Crystal edges
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner facet lines
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - s * 1.3);
    ctx.lineTo(this.x, this.y + s * 0.8);
    ctx.moveTo(this.x - s * 0.8, this.y);
    ctx.lineTo(this.x + s * 0.8, this.y);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + pulse * 0.1})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sparkle at top
    const sparkleAlpha = 0.5 + 0.5 * Math.sin(time * 3);
    ctx.beginPath();
    ctx.arc(this.x, this.y - s * 1.3, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
    ctx.fill();

    // Inferno tower beams
    this.renderBeams(ctx);

    // HP bar below crystal
    this.renderHPBar(ctx);

    ctx.restore();
  }

  renderBeams(ctx) {
    if (this.targets.length === 0) return;

    ctx.save();
    for (const target of this.targets) {
      if (!target.active) continue;

      const dx = target.x - this.x;
      const dy = target.y - this.y;

      // Wavy beam offset
      const wave = Math.sin(this.beamPhase + dx * 0.05) * 3;

      // Outer glow
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      const midX = (this.x + target.x) / 2 + wave;
      const midY = (this.y + target.y) / 2 + wave;
      ctx.quadraticCurveTo(midX, midY, target.x, target.y);
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.15 + 0.1 * Math.sin(this.beamPhase)})`;
      ctx.lineWidth = 6;
      ctx.stroke();

      // Inner beam
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.quadraticCurveTo(midX, midY, target.x, target.y);
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.5 + 0.3 * Math.sin(this.beamPhase * 1.5)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Core beam (bright white)
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.quadraticCurveTo(midX, midY, target.x, target.y);
      ctx.strokeStyle = `rgba(200, 255, 255, ${0.4 + 0.2 * Math.sin(this.beamPhase * 2)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  renderHPBar(ctx) {
    const barWidth = 50;
    const barHeight = 6;
    const barX = this.x - barWidth / 2;
    const barY = this.y + this.size + 12;
    const hpPercent = this.hp / this.maxHp;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // HP color
    let barColor;
    if (hpPercent > 0.6) barColor = '#00e5ff';
    else if (hpPercent > 0.3) barColor = '#ffc107';
    else barColor = '#f44336';

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // HP text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(this.hp)}/${Math.ceil(this.maxHp)}`, this.x, barY + barHeight + 10);
    ctx.textAlign = 'left';
  }
}

export default Crystal;
