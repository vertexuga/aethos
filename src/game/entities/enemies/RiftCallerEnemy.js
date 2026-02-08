import Entity from '../Entity.js';
import { ENEMY_CONFIG } from '../../data/enemyConfig.js';

class RiftCallerEnemy extends Entity {
  constructor({ x, y }) {
    const config = ENEMY_CONFIG.riftCaller;

    super({
      x, y, vx: 0, vy: 0,
      size: config.size,
      type: 'enemy-riftCaller',
      color: config.color
    });

    this.speed = config.speed;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.contactDamage = config.contactDamage;
    this.xpReward = config.xpReward;
    this.element = config.element;

    // Summoning
    this.summonCount = config.summonCount;
    this.summonCooldown = config.summonCooldown;
    this.summonTimer = config.summonCooldown * 0.5; // Start halfway to first summon
    this.isSummoning = false;
    this.summonAnimTimer = 0;
    this.summonAnimDuration = 800; // ms for summon animation

    // Flee
    this.fleeRadius = config.fleeRadius;

    // Portal orb animation
    this.orbPhase = Math.random() * Math.PI * 2;

    // Reference to slime pool (for spawning minions)
    this.minionPool = null;

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
      this.orbPhase += dt * 3;
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

    // Flee when player is close (only flee from player, not crystal)
    const playerDx = this.player.x - this.x;
    const playerDy = this.player.y - this.y;
    const playerDist = Math.sqrt(playerDx * playerDx + playerDy * playerDy);

    if (playerDist < this.fleeRadius && playerDist > 0) {
      this.vx = -(playerDx / playerDist) * this.speed * 1.5 * this.slowFactor;
      this.vy = -(playerDy / playerDist) * this.speed * 1.5 * this.slowFactor;
    } else if (dist > this.fleeRadius * 2 && dist > 0) {
      this.vx = (dx / dist) * this.speed * 0.5 * this.slowFactor;
      this.vy = (dy / dist) * this.speed * 0.5 * this.slowFactor;
    } else if (dist > 0) {
      const perpX = -dy / dist;
      const perpY = dx / dist;
      this.vx = perpX * this.speed * 0.4 * this.slowFactor;
      this.vy = perpY * this.speed * 0.4 * this.slowFactor;
    }

    super.update(dt);

    // Summon timer
    this.summonTimer += dt * 1000;
    if (this.summonTimer >= this.summonCooldown && !this.isSummoning) {
      this.isSummoning = true;
      this.summonAnimTimer = 0;
    }

    // Summon animation
    if (this.isSummoning) {
      this.summonAnimTimer += dt * 1000;
      if (this.summonAnimTimer >= this.summonAnimDuration) {
        this.spawnMinions();
        this.isSummoning = false;
        this.summonTimer = 0;
      }
    }

    // Visual
    this.orbPhase += dt * 3;

    // Damage flash
    if (this.damageFlash) {
      this.damageFlashTimer += dt * 1000;
      if (this.damageFlashTimer >= this.damageFlashDuration) {
        this.damageFlash = false;
        this.damageFlashTimer = 0;
      }
    }
  }

  spawnMinions() {
    if (!this.minionPool) return;

    for (let i = 0; i < this.summonCount; i++) {
      const angle = (i / this.summonCount) * Math.PI * 2;
      const spawnDist = 40;
      const spawnX = this.x + Math.cos(angle) * spawnDist;
      const spawnY = this.y + Math.sin(angle) * spawnDist;
      this.minionPool.spawn({ x: spawnX, y: spawnY });
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    let renderColor = this.color;
    if (this.damageFlash) {
      renderColor = '#ffffff';
    }

    // Portal aura (spinning ring)
    ctx.globalCompositeOperation = 'lighter';
    const auraRadius = this.size + 6 + Math.sin(this.orbPhase) * 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, auraRadius, this.orbPhase, this.orbPhase + Math.PI * 1.2);
    ctx.strokeStyle = `rgba(124, 77, 255, 0.3)`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y, auraRadius + 2, this.orbPhase + Math.PI, this.orbPhase + Math.PI * 2.2);
    ctx.strokeStyle = `rgba(179, 136, 255, 0.2)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    // Main body (hooded figure silhouette)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = renderColor;
    ctx.fill();

    // Hood detail (darker top arc)
    ctx.beginPath();
    ctx.arc(this.x, this.y - 2, this.size * 0.7, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#311b92';
    ctx.fill();

    // Floating portal orb
    const orbX = this.x + Math.cos(this.orbPhase * 1.5) * 10;
    const orbY = this.y - this.size - 8 + Math.sin(this.orbPhase) * 3;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#b388ff';
    ctx.fill();

    // Summoning animation — expanding rings
    if (this.isSummoning) {
      const progress = this.summonAnimTimer / this.summonAnimDuration;
      for (let i = 0; i < 3; i++) {
        const ringRadius = 20 + progress * 30 + i * 10;
        const alpha = (1 - progress) * 0.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(124, 77, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
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
    const barY = this.y - this.size - 16;
    const hpPercent = this.hp / this.maxHp;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    let barColor = hpPercent > 0.6 ? '#4caf50' : hpPercent > 0.3 ? '#ffc107' : '#f44336';
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }

  reset({ x, y, player }) {
    const config = ENEMY_CONFIG.riftCaller;
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
    this.summonTimer = config.summonCooldown * 0.5;
    this.isSummoning = false;
    this.summonAnimTimer = 0;

    // Reset stun & slow
    this.stunTimer = 0;
    this.slowFactor = 1.0;
  }
}

export default RiftCallerEnemy;
