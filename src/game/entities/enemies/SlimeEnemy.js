import Entity from '../Entity.js';
import { ENEMY_CONFIG } from '../../data/enemyConfig.js';

class SlimeEnemy extends Entity {
  constructor({ x, y }) {
    const config = ENEMY_CONFIG.slime;

    super({
      x,
      y,
      vx: 0,
      vy: 0,
      size: config.size,
      type: 'enemy-slime',
      color: config.color
    });

    this.speed = config.speed;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.contactDamage = config.contactDamage;
    this.xpReward = config.xpReward;
    this.element = config.element || null;

    // Dash attack config
    this.dashSpeed = config.dashSpeed;
    this.dashDuration = config.dashDuration;
    this.dashCooldown = config.dashCooldown;
    this.dashTriggerRange = config.dashTriggerRange;
    this.dashChargeTime = config.dashChargeTime;

    // Dash state machine: chasing | charging | dashing | cooldown
    this.dashState = 'chasing';
    this.dashTimer = 0;
    this.dashDirX = 0;
    this.dashDirY = 0;

    // Merge mechanic
    this.mergeSize = 1; // 1-3 scale
    this.baseSize = config.size;

    // Group merge animation
    this.mergeState = 'none'; // 'none' | 'gathering' | 'orbiting' | 'absorbing'
    this.mergeTarget = { x: 0, y: 0 };
    this.mergeGroupId = null;
    this.mergePartners = [];
    this.mergeOrbitPhase = Math.random() * Math.PI * 2;
    this.mergeOrbitRadius = 0;
    this.mergeAbsorbTimer = 0;
    this.isMergeSurvivor = false;
    this.mergeParticles = [];

    // Visual animation
    this.bouncePhase = Math.random() * Math.PI * 2;
    this.trailParticles = [];
    this.dripParticles = [];

    // Damage flash
    this.damageFlash = false;
    this.damageFlashDuration = 150;
    this.damageFlashTimer = 0;

    this.justDied = false;
    this.player = null;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.damageFlash = true;
    this.damageFlashTimer = 0;
    if (this.hp <= 0) this.die();
  }

  die() {
    this.justDied = true;
    this.destroy();
  }

  update(dt) {
    if (!this.active || !this.player) return;

    // Group merge behavior overrides normal AI
    if (this.mergeState !== 'none') {
      this.updateMerge(dt);
      if (this.mergeState === 'gathering') {
        super.update(dt);
      }
      this.bouncePhase += dt * 8;
      // Thicker trail during merge
      if (this.mergeState === 'orbiting' || Math.sqrt(this.vx * this.vx + this.vy * this.vy) > 10) {
        this.trailParticles.push({
          x: this.x + (Math.random() - 0.5) * this.size,
          y: this.y + (Math.random() - 0.5) * this.size,
          life: 0.6, maxLife: 0.6,
          radius: this.size * 0.4 + Math.random() * 3,
        });
      }
      for (let i = this.trailParticles.length - 1; i >= 0; i--) {
        this.trailParticles[i].life -= dt;
        if (this.trailParticles[i].life <= 0) this.trailParticles.splice(i, 1);
      }
      if (this.damageFlash) {
        this.damageFlashTimer += dt * 1000;
        if (this.damageFlashTimer >= this.damageFlashDuration) {
          this.damageFlash = false;
          this.damageFlashTimer = 0;
        }
      }
      return;
    }

    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Dash state machine
    this.dashTimer += dt * 1000;

    switch (this.dashState) {
      case 'chasing':
        if (distance > 0) {
          this.vx = (dx / distance) * this.speed;
          this.vy = (dy / distance) * this.speed;
        }
        if (distance <= this.dashTriggerRange) {
          this.dashState = 'charging';
          this.dashTimer = 0;
          // Lock dash direction
          if (distance > 0) {
            this.dashDirX = dx / distance;
            this.dashDirY = dy / distance;
          }
        }
        break;

      case 'charging':
        // Slow down during charge (telegraph)
        this.vx *= 0.9;
        this.vy *= 0.9;
        // Update dash direction to track player during charge
        if (distance > 0) {
          this.dashDirX = dx / distance;
          this.dashDirY = dy / distance;
        }
        if (this.dashTimer >= this.dashChargeTime) {
          this.dashState = 'dashing';
          this.dashTimer = 0;
          this.vx = this.dashDirX * this.dashSpeed;
          this.vy = this.dashDirY * this.dashSpeed;
        }
        break;

      case 'dashing':
        // Keep dash velocity (no change)
        if (this.dashTimer >= this.dashDuration) {
          this.dashState = 'cooldown';
          this.dashTimer = 0;
        }
        break;

      case 'cooldown':
        // Resume normal chase
        if (distance > 0) {
          this.vx = (dx / distance) * this.speed;
          this.vy = (dy / distance) * this.speed;
        }
        if (this.dashTimer >= this.dashCooldown) {
          this.dashState = 'chasing';
          this.dashTimer = 0;
        }
        break;
    }

    super.update(dt);

    // Bounce animation
    this.bouncePhase += dt * 6;

    // Trail particles (when moving)
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 20 && Math.random() < 0.4) {
      this.trailParticles.push({
        x: this.x + (Math.random() - 0.5) * this.size,
        y: this.y + (Math.random() - 0.5) * this.size,
        life: 0.4,
        maxLife: 0.4,
        radius: this.size * 0.3 + Math.random() * 2,
      });
    }

    // Update trail particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      this.trailParticles[i].life -= dt;
      if (this.trailParticles[i].life <= 0) this.trailParticles.splice(i, 1);
    }

    // Drip particles
    if (Math.random() < 0.08) {
      this.dripParticles.push({
        x: this.x + (Math.random() - 0.5) * this.size * 0.8,
        y: this.y + this.size * 0.5,
        vy: 15 + Math.random() * 10,
        life: 0.5,
        maxLife: 0.5,
        radius: 1 + Math.random(),
      });
    }
    for (let i = this.dripParticles.length - 1; i >= 0; i--) {
      const d = this.dripParticles[i];
      d.y += d.vy * dt;
      d.life -= dt;
      if (d.life <= 0) this.dripParticles.splice(i, 1);
    }

    // Damage flash
    if (this.damageFlash) {
      this.damageFlashTimer += dt * 1000;
      if (this.damageFlashTimer >= this.damageFlashDuration) {
        this.damageFlash = false;
        this.damageFlashTimer = 0;
      }
    }
  }

  startMerge(target, groupId, partners, isSurvivor, orbitPhaseOffset) {
    this.mergeState = 'gathering';
    this.mergeTarget = { x: target.x, y: target.y };
    this.mergeGroupId = groupId;
    this.mergePartners = partners;
    this.isMergeSurvivor = isSurvivor;
    this.mergeOrbitPhase = orbitPhaseOffset;
    this.mergeOrbitRadius = 0;
    this.mergeAbsorbTimer = 0;
    this.dashState = 'cooldown';
    this.dashTimer = 0;
  }

  updateMerge(dt) {
    this.mergeOrbitPhase += dt * 3.5;

    switch (this.mergeState) {
      case 'gathering': {
        const dx = this.mergeTarget.x - this.x;
        const dy = this.mergeTarget.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 8) {
          const gatherSpeed = this.speed * 1.5;
          this.vx = (dx / dist) * gatherSpeed;
          this.vy = (dy / dist) * gatherSpeed;
        } else {
          this.vx = 0;
          this.vy = 0;
        }
        // Gathering sparkles flying toward center
        if (Math.random() < 0.5) {
          this.mergeParticles.push({
            x: this.x + (Math.random() - 0.5) * this.size * 2,
            y: this.y + (Math.random() - 0.5) * this.size * 2,
            vx: (this.mergeTarget.x - this.x) * 0.5 + (Math.random() - 0.5) * 30,
            vy: (this.mergeTarget.y - this.y) * 0.5 + (Math.random() - 0.5) * 30,
            life: 0.6, maxLife: 0.6,
            radius: 1.5 + Math.random() * 1.5,
          });
        }
        break;
      }
      case 'orbiting': {
        this.mergeOrbitRadius = Math.max(2, this.mergeOrbitRadius - dt * 18);
        this.x = this.mergeTarget.x + Math.cos(this.mergeOrbitPhase) * this.mergeOrbitRadius;
        this.y = this.mergeTarget.y + Math.sin(this.mergeOrbitPhase) * this.mergeOrbitRadius;
        this.vx = 0;
        this.vy = 0;
        // Orbit trail sparkles
        if (Math.random() < 0.7) {
          this.mergeParticles.push({
            x: this.x, y: this.y,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 0.4, maxLife: 0.4,
            radius: 1 + Math.random() * 2,
          });
        }
        break;
      }
      case 'absorbing': {
        this.mergeAbsorbTimer += dt;
        if (!this.isMergeSurvivor) {
          // Shrink and fly toward center
          const dx = this.mergeTarget.x - this.x;
          const dy = this.mergeTarget.y - this.y;
          this.x += dx * dt * 6;
          this.y += dy * dt * 6;
          // Dissolve particles
          for (let i = 0; i < 3; i++) {
            this.mergeParticles.push({
              x: this.x + (Math.random() - 0.5) * this.size,
              y: this.y + (Math.random() - 0.5) * this.size,
              vx: (this.mergeTarget.x - this.x) * 2 + (Math.random() - 0.5) * 40,
              vy: (this.mergeTarget.y - this.y) * 2 + (Math.random() - 0.5) * 40,
              life: 0.5, maxLife: 0.5,
              radius: 1 + Math.random() * 2,
            });
          }
        }
        this.vx = 0;
        this.vy = 0;
        break;
      }
    }

    // Update merge particles
    for (let i = this.mergeParticles.length - 1; i >= 0; i--) {
      const p = this.mergeParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.mergeParticles.splice(i, 1);
    }
  }

  applyMerge() {
    if (this.mergeSize >= 3) return;
    this.mergeSize++;
    const scale = 1 + 0.4 * (this.mergeSize - 1);
    this.size = Math.round(this.baseSize * scale);
    this.maxHp = Math.round(this.maxHp * 1.5);
    this.hp = this.maxHp;
    this.contactDamage += 5;
  }

  renderMergeEffects(ctx) {
    // Goo tendrils connecting to merge center
    if (this.mergeState === 'gathering' || this.mergeState === 'orbiting') {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      const cp1x = this.x + (this.mergeTarget.x - this.x) * 0.3 + Math.sin(this.bouncePhase * 3) * 12;
      const cp1y = this.y + (this.mergeTarget.y - this.y) * 0.3 + Math.cos(this.bouncePhase * 2.5) * 12;
      const cp2x = this.x + (this.mergeTarget.x - this.x) * 0.7 + Math.cos(this.bouncePhase * 2) * 8;
      const cp2y = this.y + (this.mergeTarget.y - this.y) * 0.7 + Math.sin(this.bouncePhase * 3.5) * 8;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, this.mergeTarget.x, this.mergeTarget.y);
      const tendrilAlpha = this.mergeState === 'orbiting' ? 0.5 : 0.25;
      ctx.strokeStyle = `rgba(76, 255, 3, ${tendrilAlpha + Math.sin(this.bouncePhase) * 0.1})`;
      ctx.lineWidth = 2.5 + Math.sin(this.bouncePhase * 2);
      ctx.stroke();
    }

    // Pulsing aura around self
    const auraR = this.size * (this.mergeState === 'orbiting' ? 2.2 : 1.6) + Math.sin(this.bouncePhase * 3) * 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, auraR, 0, Math.PI * 2);
    const auraAlpha = this.mergeState === 'absorbing' ? 0.35 : 0.12;
    ctx.fillStyle = `rgba(118, 255, 3, ${auraAlpha})`;
    ctx.fill();

    // Merge particles (green sparkles)
    for (const p of this.mergeParticles) {
      const alpha = (p.life / p.maxLife) * 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(76, 255, 3, ${alpha})`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#76ff03';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Center vortex swirl (survivor only renders this to avoid duplicates)
    if (this.isMergeSurvivor && this.mergeState === 'orbiting') {
      const vortexR = 10 + Math.sin(this.bouncePhase * 2) * 3;
      ctx.beginPath();
      ctx.arc(this.mergeTarget.x, this.mergeTarget.y, vortexR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(118, 255, 3, 0.25)';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#76ff03';
      ctx.fill();
      ctx.shadowBlur = 0;
      // Spinning energy lines
      for (let i = 0; i < 4; i++) {
        const angle = this.bouncePhase * 2 + (i * Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(this.mergeTarget.x, this.mergeTarget.y);
        ctx.lineTo(
          this.mergeTarget.x + Math.cos(angle) * vortexR * 2.5,
          this.mergeTarget.y + Math.sin(angle) * vortexR * 2.5
        );
        ctx.strokeStyle = 'rgba(76, 255, 3, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Absorbing burst ring (survivor only)
    if (this.isMergeSurvivor && this.mergeState === 'absorbing') {
      const burstProgress = Math.min(1, this.mergeAbsorbTimer / 0.6);
      const burstR = this.size * 4 * burstProgress;
      ctx.beginPath();
      ctx.arc(this.x, this.y, burstR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(76, 255, 3, ${0.8 * (1 - burstProgress)})`;
      ctx.lineWidth = 3 * (1 - burstProgress);
      ctx.shadowBlur = 20 * (1 - burstProgress);
      ctx.shadowColor = '#76ff03';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    // Merge visual effects (world space, before translate)
    if (this.mergeState !== 'none') {
      this.renderMergeEffects(ctx);
    }

    // Trail particles
    for (const p of this.trailParticles) {
      const alpha = (p.life / p.maxLife) * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`;
      ctx.fill();
    }

    // Drip particles
    for (const d of this.dripParticles) {
      const alpha = (d.life / d.maxLife) * 0.5;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 142, 60, ${alpha})`;
      ctx.fill();
    }

    // Squash/stretch bounce
    const bounce = Math.sin(this.bouncePhase);
    const scaleX = 1 + bounce * 0.08;
    const scaleY = 1 - bounce * 0.08;

    ctx.translate(this.x, this.y);
    ctx.scale(scaleX, scaleY);

    // Absorbing: non-survivors shrink and fade out
    if (this.mergeState === 'absorbing' && !this.isMergeSurvivor) {
      const fadeProgress = Math.min(1, this.mergeAbsorbTimer / 0.5);
      ctx.globalAlpha = 1 - fadeProgress * 0.85;
      const shrink = 1 - fadeProgress * 0.7;
      ctx.scale(shrink, shrink);
    }

    let renderColor = this.color;
    if (this.damageFlash) {
      renderColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffffff';
    } else {
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
    }

    // Merge glow (orbiting or absorbing survivor)
    if (this.mergeState === 'orbiting' || (this.mergeState === 'absorbing' && this.isMergeSurvivor)) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#76ff03';
    }

    // Charging telegraph: pulsing glow
    if (this.dashState === 'charging') {
      const chargeProgress = this.dashTimer / this.dashChargeTime;
      const pulseScale = 1 + chargeProgress * 0.3 + Math.sin(this.dashTimer * 0.02) * 0.1;
      ctx.scale(pulseScale, pulseScale);
      ctx.shadowBlur = 15 + chargeProgress * 15;
      ctx.shadowColor = '#76ff03';
    }

    // Dashing glow
    if (this.dashState === 'dashing') {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#b9f6ca';
    }

    // Main body
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fillStyle = renderColor;
    ctx.fill();

    // Highlight/sheen (upper-left lighter green arc)
    if (!this.damageFlash) {
      ctx.beginPath();
      ctx.arc(-this.size * 0.25, -this.size * 0.25, this.size * 0.6, -Math.PI * 0.8, -Math.PI * 0.1);
      ctx.strokeStyle = 'rgba(200, 255, 200, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Eyes
    const eyeSpacing = this.size * 0.35;
    const eyeY = -this.size * 0.15;
    const eyeRadius = this.size * 0.18;
    const pupilRadius = eyeRadius * 0.55;

    // Pupil direction based on velocity
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    let pupilDx = 0, pupilDy = 0;
    if (speed > 5) {
      pupilDx = (this.vx / speed) * eyeRadius * 0.3;
      pupilDy = (this.vy / speed) * eyeRadius * 0.3;
    }

    // Left eye
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#e8f5e9';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-eyeSpacing + pupilDx, eyeY + pupilDy, pupilRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#1b5e20';
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.arc(eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#e8f5e9';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing + pupilDx, eyeY + pupilDy, pupilRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#1b5e20';
    ctx.fill();

    ctx.restore();

    // Health bar
    this.renderHealthBar(ctx);
  }

  renderHealthBar(ctx) {
    const barWidth = 30;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.size - 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpPercent = this.hp / this.maxHp;
    let barColor;
    if (hpPercent > 0.6) barColor = '#4caf50';
    else if (hpPercent > 0.3) barColor = '#ffc107';
    else barColor = '#f44336';

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Show merge level
    if (this.mergeSize > 1) {
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.fillText(`x${this.mergeSize}`, barX + barWidth + 2, barY + 4);
    }
  }

  reset({ x, y, player }) {
    const config = ENEMY_CONFIG.slime;

    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.contactDamage = config.contactDamage;
    this.active = true;
    this.justDied = false;
    this.damageFlash = false;
    this.damageFlashTimer = 0;
    this.player = player;

    // Reset dash state
    this.dashState = 'chasing';
    this.dashTimer = 0;

    // Reset merge
    this.mergeSize = 1;
    this.size = config.size;
    this.baseSize = config.size;
    this.mergeState = 'none';
    this.mergeTarget = { x: 0, y: 0 };
    this.mergeGroupId = null;
    this.mergePartners = [];
    this.mergeOrbitPhase = Math.random() * Math.PI * 2;
    this.mergeOrbitRadius = 0;
    this.mergeAbsorbTimer = 0;
    this.isMergeSurvivor = false;
    this.mergeParticles = [];

    // Reset particles
    this.trailParticles = [];
    this.dripParticles = [];
    this.bouncePhase = Math.random() * Math.PI * 2;
  }
}

export default SlimeEnemy;
