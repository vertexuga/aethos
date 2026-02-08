import Entity from '../Entity.js';
import { ENEMY_CONFIG } from '../../data/enemyConfig.js';

class PhaseWraithEnemy extends Entity {
  constructor({ x, y }) {
    const config = ENEMY_CONFIG.phaseWraith;

    super({
      x, y, vx: 0, vy: 0,
      size: config.size,
      type: 'enemy-phaseWraith',
      color: config.color
    });

    this.speed = config.speed;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.contactDamage = config.contactDamage;
    this.xpReward = config.xpReward;
    this.element = config.element;

    // Phase mechanic
    this.phaseDuration = config.phaseDuration;
    this.visibleDuration = config.visibleDuration;
    this.phaseTimer = 0;
    this.isPhased = false; // true = invulnerable + transparent
    this.hasTeleported = false; // teleport once per phase

    // Visual flicker
    this.flickerPhase = Math.random() * Math.PI * 2;

    // Damage flash
    this.damageFlash = false;
    this.damageFlashDuration = 150;
    this.damageFlashTimer = 0;
    this.justDied = false;
    this.player = null;
    this.crystal = null;

    // Wall attack state
    this.wallStuckTimer = 0;
    this.wallAttackDPS = 10;

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
    // Invulnerable while phased
    if (this.isPhased) return;

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
      this.flickerPhase += dt * 15;
      if (this.damageFlash) {
        this.damageFlashTimer += dt * 1000;
        if (this.damageFlashTimer >= this.damageFlashDuration) {
          this.damageFlash = false;
          this.damageFlashTimer = 0;
        }
      }
      return;
    }

    this.phaseTimer += dt * 1000;
    this.flickerPhase += dt * 15; // Fast flicker when phased

    if (this.isPhased) {
      // Phased (invulnerable) — teleport behind player once
      if (!this.hasTeleported && this.phaseTimer > this.phaseDuration * 0.5) {
        this.teleportBehindPlayer();
        this.hasTeleported = true;
      }

      // End phase
      if (this.phaseTimer >= this.phaseDuration) {
        this.isPhased = false;
        this.phaseTimer = 0;
        this.hasTeleported = false;
      }
    } else {
      // Visible (vulnerable) — chase target aggressively
      const target = this.getTarget();
      if (target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          this.vx = (dx / dist) * this.speed * this.slowFactor;
          this.vy = (dy / dist) * this.speed * this.slowFactor;
        }
      }

      // Wall attack (only when not phased)
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

      super.update(dt);

      // Start phase cycle
      if (this.phaseTimer >= this.visibleDuration) {
        this.isPhased = true;
        this.phaseTimer = 0;
      }
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

  teleportBehindPlayer() {
    if (!this.player) return;

    // Determine direction player is moving, teleport behind
    const dirX = this.player.vx;
    const dirY = this.player.vy;
    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);

    let behindX, behindY;
    if (dirLen > 0) {
      // Behind the player's movement direction
      behindX = this.player.x - (dirX / dirLen) * 60;
      behindY = this.player.y - (dirY / dirLen) * 60;
    } else {
      // Player standing still — random position nearby
      const angle = Math.random() * Math.PI * 2;
      behindX = this.player.x + Math.cos(angle) * 60;
      behindY = this.player.y + Math.sin(angle) * 60;
    }

    this.x = behindX;
    this.y = behindY;
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    // Phase visual: translucent + flickering
    if (this.isPhased) {
      const flicker = 0.1 + 0.15 * Math.abs(Math.sin(this.flickerPhase));
      ctx.globalAlpha = flicker;
    } else {
      // Slight translucency even when visible (spectral look)
      ctx.globalAlpha = 0.7 + 0.1 * Math.sin(this.flickerPhase * 0.3);
    }

    let renderColor = this.color;
    if (this.damageFlash) {
      renderColor = '#ffffff';
    }

    // Ghostly trail (draw 2 trailing circles)
    if (!this.isPhased) {
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(
          this.x - this.vx * 0.02 * i,
          this.y - this.vy * 0.02 * i,
          this.size * (1 - i * 0.2),
          0, Math.PI * 2
        );
        ctx.fillStyle = `rgba(176, 190, 197, ${0.15 / i})`;
        ctx.fill();
      }
    }

    // Main body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = renderColor;
    ctx.fill();

    // Eye glow (small bright dot)
    ctx.globalAlpha = this.isPhased ? 0.3 : 0.9;
    ctx.beginPath();
    ctx.arc(this.x - 3, this.y - 2, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#e3f2fd';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + 3, this.y - 2, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#e3f2fd';
    ctx.fill();

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

    // Health bar only when visible
    if (!this.isPhased) {
      this.renderHealthBar(ctx);
    }
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
    const config = ENEMY_CONFIG.phaseWraith;
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
    this.isPhased = false;
    this.phaseTimer = 0;
    this.hasTeleported = false;

    // Reset stun & slow
    this.stunTimer = 0;
    this.slowFactor = 1.0;
  }
}

export default PhaseWraithEnemy;
