import Entity from '../Entity.js';
import { ENEMY_CONFIG } from '../../data/enemyConfig.js';

class GravityWellEnemy extends Entity {
  constructor({ x, y }) {
    const config = ENEMY_CONFIG.gravityWell;

    super({
      x, y, vx: 0, vy: 0,
      size: config.size,
      type: 'enemy-gravityWell',
      color: config.color
    });

    this.speed = config.speed;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.contactDamage = config.contactDamage;
    this.xpReward = config.xpReward;
    this.element = config.element;

    // Gravity pull
    this.pullForce = config.pullForce;
    this.pullRadius = config.pullRadius;

    // Pulse explosion
    this.pulseRadius = config.pulseRadius;
    this.pulseDamage = config.pulseDamage;
    this.pulseCooldown = config.pulseCooldown;
    this.pulseTimer = 0;
    this.pulseReady = true;
    this.pulseFlash = 0; // Visual feedback for pulse

    // Visual rotation
    this.rotationAngle = 0;
    this.swirlPhase = Math.random() * Math.PI * 2;

    // Damage flash
    this.damageFlash = false;
    this.damageFlashDuration = 150;
    this.damageFlashTimer = 0;
    this.justDied = false;
    this.player = null;
    this.crystal = null;

    // Wall attack state
    this.wallStuckTimer = 0;
    this.wallAttackDPS = 12;

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
      this.rotationAngle += dt * 2;
      this.swirlPhase += dt * 3;
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

    // Slow chase toward target
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.vx = (dx / dist) * this.speed * this.slowFactor;
      this.vy = (dy / dist) * this.speed * this.slowFactor;
    }
    super.update(dt);

    // Apply gravitational pull to player (use inverted dx/dy: enemy→player)
    const pullDx = this.x - this.player.x;
    const pullDy = this.y - this.player.y;
    const pullDist = Math.sqrt(pullDx * pullDx + pullDy * pullDy);

    if (pullDist < this.pullRadius && pullDist > 0) {
      const strength = (1 - pullDist / this.pullRadius) * this.pullForce;
      const pullX = (pullDx / pullDist) * strength * dt;
      const pullY = (pullDy / pullDist) * strength * dt;
      this.player.x += pullX;
      this.player.y += pullY;
    }

    // Pulse explosion when player gets too close
    if (pullDist < this.pulseRadius && this.pulseReady) {
      this.pulseReady = false;
      this.pulseTimer = 0;
      this.pulseFlash = 1.0;

      // Damage player
      this.player.takeDamage(this.pulseDamage);

      // Knockback player away
      if (pullDist > 0) {
        const knockbackForce = 200;
        this.player.x -= (pullDx / pullDist) * knockbackForce * 0.5;
        this.player.y -= (pullDy / pullDist) * knockbackForce * 0.5;
      }
    }

    // Pulse cooldown
    if (!this.pulseReady) {
      this.pulseTimer += dt * 1000;
      if (this.pulseTimer >= this.pulseCooldown) {
        this.pulseReady = true;
      }
    }

    // Visual updates
    this.rotationAngle += dt * 2;
    this.swirlPhase += dt * 3;
    if (this.pulseFlash > 0) this.pulseFlash -= dt * 3;

    // Damage flash
    if (this.damageFlash) {
      this.damageFlashTimer += dt * 1000;
      if (this.damageFlashTimer >= this.damageFlashDuration) {
        this.damageFlash = false;
        this.damageFlashTimer = 0;
      }
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    // Pull radius indicator
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.pullRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(55, 71, 79, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Swirling dark energy rings
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const ringRadius = this.size + 8 + i * 6;
      const alpha = 0.15 - i * 0.04;
      ctx.beginPath();
      ctx.arc(this.x, this.y, ringRadius, this.rotationAngle + i, this.rotationAngle + i + Math.PI * 1.5);
      ctx.strokeStyle = `rgba(100, 120, 140, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Pulse flash effect
    if (this.pulseFlash > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.pulseRadius * (1 + (1 - this.pulseFlash) * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 100, ${this.pulseFlash * 0.4})`;
      ctx.fill();
    }

    let renderColor = this.color;
    if (this.damageFlash) {
      renderColor = '#ffffff';
    }

    // Main body (dark sphere)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = renderColor;
    ctx.fill();

    // Inner swirl detail
    const swirlX = this.x + Math.cos(this.swirlPhase) * 4;
    const swirlY = this.y + Math.sin(this.swirlPhase) * 4;
    ctx.beginPath();
    ctx.arc(swirlX, swirlY, this.size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#1a237e';
    ctx.fill();

    // Pulse ready indicator (red glow when ready to pulse)
    if (this.pulseReady) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 80, 80, ${0.3 + 0.2 * Math.sin(this.swirlPhase * 2)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

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
    const barY = this.y - this.size - 10;
    const hpPercent = this.hp / this.maxHp;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    let barColor = hpPercent > 0.6 ? '#4caf50' : hpPercent > 0.3 ? '#ffc107' : '#f44336';
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }

  reset({ x, y, player }) {
    const config = ENEMY_CONFIG.gravityWell;
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
    this.pulseReady = true;
    this.pulseTimer = 0;
    this.pulseFlash = 0;

    // Reset stun & slow
    this.stunTimer = 0;
    this.slowFactor = 1.0;
  }
}

export default GravityWellEnemy;
