import Entity from '../Entity.js';
import { DUNGEON_ENEMY_CONFIG } from '../../data/dungeonEnemyConfig.js';

class DungeonGuardianEnemy extends Entity {
  constructor({ x, y }) {
    const config = DUNGEON_ENEMY_CONFIG.dungeonGuardian;

    super({
      x, y, vx: 0, vy: 0,
      size: config.size,
      type: 'enemy-dungeonGuardian',
      color: config.color,
    });

    this.speed = config.speed;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.contactDamage = config.contactDamage;
    this.xpReward = config.xpReward;

    // Ranged attack
    this.attackRange = config.attackRange;
    this.attackCooldown = config.attackCooldown;
    this.attackTimer = 0;
    this.projectileSpeed = config.projectileSpeed;
    this.projectileDamage = config.projectileDamage;
    this.projectileSize = config.projectileSize;

    // Visual
    this.rotationAngle = 0;
    this.glowPhase = Math.random() * Math.PI * 2;
    this.attackFlash = 0;

    // Damage flash
    this.damageFlash = false;
    this.damageFlashDuration = 150;
    this.damageFlashTimer = 0;
    this.justDied = false;
    this.player = null;
    this.crystal = null;

    // Wall attack state
    this.wallStuckTimer = 0;
    this.wallAttackDPS = 15;

    // Projectile storage (managed externally by game engine)
    this.pendingProjectile = null;

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
      this.rotationAngle += dt * 1.5;
      this.glowPhase += dt * 2.5;
      if (this.damageFlash) {
        this.damageFlashTimer += dt * 1000;
        if (this.damageFlashTimer >= this.damageFlashDuration) {
          this.damageFlash = false;
          this.damageFlashTimer = 0;
        }
      }
      return;
    }

    // Stationary — no movement (speed = 0)

    // Attack timer
    this.attackTimer += dt * 1000;

    // Ranged attack when player is in range
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.attackRange && this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      this.attackFlash = 1.0;

      // Queue a projectile for the game engine to spawn
      const angle = Math.atan2(dy, dx);
      this.pendingProjectile = {
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * this.projectileSpeed,
        vy: Math.sin(angle) * this.projectileSpeed,
        damage: this.projectileDamage,
        size: this.projectileSize,
        color: '#ff8f00',
      };
    }

    // Visual updates
    this.rotationAngle += dt * 1.5;
    this.glowPhase += dt * 2.5;
    if (this.attackFlash > 0) this.attackFlash -= dt * 3;

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

    // Attack range indicator
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 111, 0, 0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Attack flash
    if (this.attackFlash > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 143, 0, ${this.attackFlash * 0.3})`;
      ctx.fill();
    }

    // Rotating sentinel rings
    const glowAlpha = 0.2 + 0.1 * Math.sin(this.glowPhase);
    for (let i = 0; i < 3; i++) {
      const angle = this.rotationAngle + (i * Math.PI * 2) / 3;
      const ringR = this.size + 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, ringR, angle, angle + Math.PI * 0.5);
      ctx.strokeStyle = `rgba(255, 143, 0, ${glowAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Main body
    let renderColor = this.color;
    if (this.damageFlash) {
      renderColor = '#ffffff';
    }

    // Diamond shape for guardian
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.size);
    ctx.lineTo(this.x + this.size * 0.7, this.y);
    ctx.lineTo(this.x, this.y + this.size);
    ctx.lineTo(this.x - this.size * 0.7, this.y);
    ctx.closePath();
    ctx.fillStyle = renderColor;
    ctx.fill();

    // Inner eye
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff3e0';
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
    this.renderHealthBar(ctx);
  }

  renderHealthBar(ctx) {
    const barWidth = 36;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.size - 12;
    const hpPercent = this.hp / this.maxHp;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    let barColor = hpPercent > 0.6 ? '#4caf50' : hpPercent > 0.3 ? '#ffc107' : '#f44336';
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }

  reset({ x, y, player }) {
    const config = DUNGEON_ENEMY_CONFIG.dungeonGuardian;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.active = true;
    this.justDied = false;
    this.damageFlash = false;
    this.damageFlashTimer = 0;
    this.player = player;
    this.attackTimer = 0;
    this.attackFlash = 0;
    this.pendingProjectile = null;

    // Reset stun & slow
    this.stunTimer = 0;
    this.slowFactor = 1.0;
  }
}

export default DungeonGuardianEnemy;
