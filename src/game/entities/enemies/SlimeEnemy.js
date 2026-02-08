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
    this.element = config.element || null; // 'plant' — weak to fire

    // White flash when taking damage
    this.damageFlash = false;
    this.damageFlashDuration = 150; // ms
    this.damageFlashTimer = 0;

    // Track if just died (for pool cleanup)
    this.justDied = false;

    // Reference to player (set by pool during spawn)
    this.player = null;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);

    // Activate damage flash
    this.damageFlash = true;
    this.damageFlashTimer = 0;

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.justDied = true;
    this.destroy();
    console.log('Slime enemy defeated!');
    // TODO: Spawn XP orb, particle effects
  }

  update(dt) {
    if (!this.active || !this.player) return;

    // Chase AI: move toward player
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Normalize direction and apply speed
      this.vx = (dx / distance) * this.speed;
      this.vy = (dy / distance) * this.speed;
    }

    // Apply movement
    super.update(dt);

    // Update damage flash timer
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

    // Damage flash effect (white flash)
    let renderColor = this.color;
    if (this.damageFlash) {
      renderColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffffff';
    } else {
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
    }

    // Draw enemy circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = renderColor;
    ctx.fill();

    ctx.restore();

    // Draw health bar above enemy
    this.renderHealthBar(ctx);
  }

  renderHealthBar(ctx) {
    const barWidth = 30;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.size - 8;

    // Background (dark)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health bar color based on HP percentage
    const hpPercent = this.hp / this.maxHp;
    let barColor;
    if (hpPercent > 0.6) {
      barColor = '#4caf50'; // Green
    } else if (hpPercent > 0.3) {
      barColor = '#ffc107'; // Yellow
    } else {
      barColor = '#f44336'; // Red
    }

    // Foreground (health)
    const currentBarWidth = barWidth * hpPercent;
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, currentBarWidth, barHeight);
  }

  reset({ x, y, player }) {
    const config = ENEMY_CONFIG.slime;

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
  }
}

export default SlimeEnemy;
