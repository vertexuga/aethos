import Entity from '../Entity.js';
import { ENEMY_CONFIG } from '../../data/enemyConfig.js';

class CurseHexerEnemy extends Entity {
  constructor({ x, y }) {
    const config = ENEMY_CONFIG.curseHexer;

    super({
      x, y, vx: 0, vy: 0,
      size: config.size,
      type: 'enemy-curseHexer',
      color: config.color
    });

    this.speed = config.speed;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.contactDamage = config.contactDamage;
    this.xpReward = config.xpReward;
    this.element = config.element;

    // Beam attack
    this.beamRange = config.beamRange;
    this.beamChargeTime = config.beamChargeTime;
    this.curseDuration = config.curseDuration;
    this.curseSlow = config.curseSlow;
    this.beamCooldown = config.beamCooldown;
    this.beamDamage = config.beamDamage;

    // Beam state
    this.beamState = 'idle'; // idle | charging | firing | cooldown
    this.beamTimer = 0;
    this.beamTargetX = 0;
    this.beamTargetY = 0;
    this.beamFireDuration = 300; // ms beam visible

    // Hex symbol animation
    this.hexPhase = Math.random() * Math.PI * 2;
    this.legPhase = Math.random() * Math.PI * 2;

    // Damage flash
    this.damageFlash = false;
    this.damageFlashDuration = 150;
    this.damageFlashTimer = 0;
    this.justDied = false;
    this.player = null;
    this.crystal = null;

    // Wall attack state
    this.wallStuckTimer = 0;
    this.wallAttackDPS = 8;

    // Stun & slow
    this.stunTimer = 0;
    this.slowFactor = 1.0;
  }

  getTarget() {
    if (this.player) {
      const dx = this.player.x - this.x;
      const dy = this.player.y - this.y;
      if (dx * dx + dy * dy < 200 * 200) return this.player;
    }
    if (this.crystal && this.crystal.active) return this.crystal;
    return this.player;
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

    // Stun: skip AI while stunned
    if (this.stunTimer > 0) {
      this.hexPhase += dt * 2;
      this.legPhase += dt * 5;
      if (this.damageFlash) {
        this.damageFlashTimer += dt * 1000;
        if (this.damageFlashTimer >= this.damageFlashDuration) {
          this.damageFlash = false;
          this.damageFlashTimer = 0;
        }
      }
      return;
    }

    const target = this.getTarget();
    if (!target) return;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Wall attack
    if (this.wallSystem) {
      const collidingWall = this.wallSystem.getCollidingWall(this);
      if (collidingWall && collidingWall.destructible) {
        this.wallStuckTimer += dt;
        if (this.wallStuckTimer > 1.0) {
          this.wallSystem.wallTakeDamage(collidingWall, this.wallAttackDPS * dt);
        }
      } else {
        this.wallStuckTimer = 0;
      }
    }

    // Movement: maintain beam range distance
    if (dist > this.beamRange * 0.9 && dist > 0) {
      this.vx = (dx / dist) * this.speed * this.slowFactor;
      this.vy = (dy / dist) * this.speed * this.slowFactor;
    } else if (dist < this.beamRange * 0.5 && dist > 0) {
      this.vx = -(dx / dist) * this.speed * 0.8 * this.slowFactor;
      this.vy = -(dy / dist) * this.speed * 0.8 * this.slowFactor;
    } else {
      if (dist > 0) {
        const perpX = -dy / dist;
        const perpY = dx / dist;
        this.vx = perpX * this.speed * 0.3 * this.slowFactor;
        this.vy = perpY * this.speed * 0.3 * this.slowFactor;
      }
    }

    super.update(dt);

    // Beam state machine
    this.beamTimer += dt * 1000;

    switch (this.beamState) {
      case 'idle':
        // Start charging when in range
        if (dist <= this.beamRange) {
          this.beamState = 'charging';
          this.beamTimer = 0;
          // Lock target position for telegraph
          this.beamTargetX = this.player.x;
          this.beamTargetY = this.player.y;
        }
        break;

      case 'charging':
        // Telegraph laser sight
        // Update target to track player during charge
        this.beamTargetX = this.player.x;
        this.beamTargetY = this.player.y;

        if (this.beamTimer >= this.beamChargeTime) {
          this.beamState = 'firing';
          this.beamTimer = 0;
          // Apply curse to player if still in range
          const fireDist = Math.sqrt(
            (this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2
          );
          if (fireDist <= this.beamRange * 1.2) {
            this.applyCurse();
          }
        }
        break;

      case 'firing':
        if (this.beamTimer >= this.beamFireDuration) {
          this.beamState = 'cooldown';
          this.beamTimer = 0;
        }
        break;

      case 'cooldown':
        if (this.beamTimer >= this.beamCooldown) {
          this.beamState = 'idle';
          this.beamTimer = 0;
        }
        break;
    }

    // Visual
    this.hexPhase += dt * 2;
    this.legPhase += dt * 5;

    // Damage flash
    if (this.damageFlash) {
      this.damageFlashTimer += dt * 1000;
      if (this.damageFlashTimer >= this.damageFlashDuration) {
        this.damageFlash = false;
        this.damageFlashTimer = 0;
      }
    }
  }

  applyCurse() {
    if (!this.player) return;

    // Deal beam damage
    this.player.takeDamage(this.beamDamage);

    // Slow player movement (frame-based timer, auto-expires)
    this.player.applySlow(this.curseSlow, this.curseDuration / 1000);
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    // Beam telegraph (red laser sight during charging)
    if (this.beamState === 'charging') {
      const chargeProgress = this.beamTimer / this.beamChargeTime;
      const pulseAlpha = 0.1 + chargeProgress * 0.4 + Math.sin(this.beamTimer * 0.02) * 0.1;

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.beamTargetX, this.beamTargetY);
      ctx.strokeStyle = `rgba(255, 50, 50, ${pulseAlpha})`;
      ctx.lineWidth = 1 + chargeProgress * 2;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Beam firing (purple beam)
    if (this.beamState === 'firing') {
      const fadeAlpha = 1 - (this.beamTimer / this.beamFireDuration);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.beamTargetX, this.beamTargetY);
      ctx.strokeStyle = `rgba(224, 64, 251, ${fadeAlpha * 0.8})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Inner white beam
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.beamTargetX, this.beamTargetY);
      ctx.strokeStyle = `rgba(255, 255, 255, ${fadeAlpha * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    let renderColor = this.color;
    if (this.damageFlash) {
      renderColor = '#ffffff';
    }

    // Spider legs (4 animated lines)
    ctx.strokeStyle = `rgba(224, 64, 251, 0.5)`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const baseAngle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const legWiggle = Math.sin(this.legPhase + i * 1.5) * 0.2;
      const angle = baseAngle + legWiggle;
      const legLen = this.size + 8;
      const midX = this.x + Math.cos(angle) * legLen * 0.6;
      const midY = this.y + Math.sin(angle) * legLen * 0.6;
      const endX = this.x + Math.cos(angle + 0.3) * legLen;
      const endY = this.y + Math.sin(angle + 0.3) * legLen;

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(midX, midY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Main body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = renderColor;
    ctx.fill();

    // Hex symbol (rotating glyph)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.hexPhase);
    const hexSize = this.size * 0.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const hx = Math.cos(angle) * hexSize;
      const hy = Math.sin(angle) * hexSize;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Stun visual: rotating stars
    if (this.stunTimer > 0) {
      const starCount = 3;
      const orbitRadius = this.size + 6;
      const rotSpeed = Date.now() / 200;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ffeb3b';
      ctx.font = `${Math.max(8, this.size * 0.6)}px sans-serif`;
      for (let i = 0; i < starCount; i++) {
        const angle = rotSpeed + (i * Math.PI * 2) / starCount;
        const sx = this.x + Math.cos(angle) * orbitRadius;
        const sy = this.y + Math.sin(angle) * orbitRadius;
        ctx.fillText('*', sx - 4, sy + 4);
      }
    }

    ctx.restore();
    this.renderHealthBar(ctx);
  }

  renderHealthBar(ctx) {
    const barWidth = 30;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.size - 14;
    const hpPercent = this.hp / this.maxHp;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    let barColor = hpPercent > 0.6 ? '#4caf50' : hpPercent > 0.3 ? '#ffc107' : '#f44336';
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }

  reset({ x, y, player }) {
    const config = ENEMY_CONFIG.curseHexer;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = config.hp;
    this.active = true;
    this.justDied = false;
    this.damageFlash = false;
    this.damageFlashTimer = 0;
    this.player = player;
    this.beamState = 'idle';
    this.beamTimer = 0;

    // Reset stun & slow
    this.stunTimer = 0;
    this.slowFactor = 1.0;
  }
}

export default CurseHexerEnemy;
