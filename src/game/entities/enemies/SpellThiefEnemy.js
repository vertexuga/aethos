import Entity from '../Entity.js';
import { ENEMY_CONFIG } from '../../data/enemyConfig.js';

class SpellThiefEnemy extends Entity {
  constructor({ x, y }) {
    const config = ENEMY_CONFIG.spellThief;

    super({
      x, y, vx: 0, vy: 0,
      size: config.size,
      type: 'enemy-spellThief',
      color: config.color
    });

    this.speed = config.speed;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.contactDamage = config.contactDamage;
    this.xpReward = config.xpReward;
    this.element = config.element;
    this.copyDelay = config.copyDelay;

    // Spell copying state
    this.copiedSpell = null;       // { name, direction }
    this.copyTimer = 0;
    this.isCasting = false;

    // Visual: mirror shimmer
    this.shimmerPhase = Math.random() * Math.PI * 2;

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

    // Reference to spell caster (set externally)
    this.spellCaster = null;
    this.entityManager = null;

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

  /**
   * Called by GameEngine when player casts a spell.
   * Copies the spell name so it can fire it back.
   */
  copySpell(spellName) {
    if (this.isCasting) return; // Don't interrupt ongoing cast
    this.copiedSpell = spellName;
    this.copyTimer = 0;
    this.isCasting = true;
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
      this.shimmerPhase += dt * 4;
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

    if (dist > 120) {
      this.vx = (dx / dist) * this.speed * this.slowFactor;
      this.vy = (dy / dist) * this.speed * this.slowFactor;
    } else if (dist > 0) {
      const perpX = -dy / dist;
      const perpY = dx / dist;
      this.vx = perpX * this.speed * 0.6 * this.slowFactor;
      this.vy = perpY * this.speed * 0.6 * this.slowFactor;
    }

    super.update(dt);

    // Spell copy countdown
    if (this.isCasting && this.copiedSpell) {
      this.copyTimer += dt * 1000;
      if (this.copyTimer >= this.copyDelay) {
        this.fireCopiedSpell();
        this.isCasting = false;
        this.copiedSpell = null;
      }
    }

    // Update shimmer
    this.shimmerPhase += dt * 4;

    // Damage flash
    if (this.damageFlash) {
      this.damageFlashTimer += dt * 1000;
      if (this.damageFlashTimer >= this.damageFlashDuration) {
        this.damageFlash = false;
        this.damageFlashTimer = 0;
      }
    }
  }

  fireCopiedSpell() {
    if (!this.player || !this.spellCaster) return;

    // Fire a projectile toward the player
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const dirX = dx / dist;
    const dirY = dy / dist;

    // Create a fake gesture result to use SpellCaster
    const result = {
      name: this.copiedSpell,
      damageModifier: 0.6, // Copied spells deal less damage
      trajectory: { direction: { x: dirX, y: dirY } },
      fromEnemy: true
    };

    // Temporarily override player position to spawn from thief
    const origPlayer = this.spellCaster.player;
    this.spellCaster.player = this; // Spawn projectile from thief position
    this.spellCaster.castSpell(result);
    this.spellCaster.player = origPlayer; // Restore
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    let renderColor = this.color;
    if (this.damageFlash) {
      renderColor = '#ffffff';
    }

    // Mirror cloak shimmer
    const shimmer = 0.7 + 0.3 * Math.sin(this.shimmerPhase);
    ctx.globalAlpha = shimmer;

    // Outer mirror ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(200, 200, 255, ${0.3 * shimmer})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Main body
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = renderColor;
    ctx.fill();

    // Mask detail (small diamond in center)
    ctx.fillStyle = '#e0e0e0';
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();

    // Casting indicator
    if (this.isCasting) {
      const progress = this.copyTimer / this.copyDelay;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 8, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.strokeStyle = '#ff4081';
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
    const config = ENEMY_CONFIG.spellThief;
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
    this.copiedSpell = null;
    this.copyTimer = 0;
    this.isCasting = false;

    // Reset stun & slow
    this.stunTimer = 0;
    this.slowFactor = 1.0;
  }
}

export default SpellThiefEnemy;
