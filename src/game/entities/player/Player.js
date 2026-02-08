import Entity from '../Entity.js';

class Player extends Entity {
  constructor({ x, y }) {
    super({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 16,
      type: 'player',
      color: '#7eb8da' // Cyan-blue
    });

    this.speed = 250; // px/sec
    this.maxHp = 100;
    this.hp = 100;

    // Mana system
    this.mana = 100;
    this.maxMana = 100;
    this.manaRegen = 5; // per second

    // Movement direction set by GameEngine based on WASD input
    this.moveDirection = { x: 0, y: 0 };

    // Invincibility frames (i-frames) after taking damage
    this.invincible = false;
    this.invincibilityDuration = 1000; // ms
    this.invincibilityTimer = 0;

    // Hit flash effect
    this.hitFlash = false;
    this.hitFlashDuration = 200; // ms
    this.hitFlashTimer = 0;

    // Canvas bounds for clamping
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    // World bounds for clamping (overrides canvas bounds when set)
    this.worldWidth = 0;
    this.worldHeight = 0;

    // Camera reference for screen shake
    this.camera = null;

    // Structure pool reference for shield pylon damage reduction
    this.structurePool = null;

    // Accessory system reference
    this.accessorySystem = null;

    // GameEngine reference for warp cancel on damage
    this.gameEngine = null;

    // Base HP regen
    this.isInBase = false;
    this.baseHpRegen = 5; // HP per second when in base
    this.healParticles = [];

    // Debuff: slow
    this.slowFactor = 1.0;
    this.slowTimer = 0; // seconds remaining

    // Wizard hat & staff particles
    this.staffParticles = [];
    this.castGlowRadius = 0;
    this.castGlowAlpha = 0;
  }

  setCanvasSize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  setWorldSize(w, h) {
    this.worldWidth = w;
    this.worldHeight = h;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  setStructurePool(structurePool) {
    this.structurePool = structurePool;
  }

  setAccessorySystem(sys) {
    this.accessorySystem = sys;
  }

  respawn(x, y) {
    this.hp = this.maxHp;
    this.mana = this.maxMana;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.active = true;
    this.invincible = false;
    this.invincibilityTimer = 0;
    this.hitFlash = false;
    this.hitFlashTimer = 0;
    this.slowFactor = 1.0;
    this.slowTimer = 0;
    this.staffParticles = [];
    this.healParticles = [];
    this.castGlowRadius = 0;
    this.castGlowAlpha = 0;
  }

  applySlow(factor, duration) {
    // Always take the stronger slow; refresh duration
    if (factor < this.slowFactor || this.slowTimer <= 0) {
      this.slowFactor = factor;
    }
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  triggerCastGlow() {
    this.castGlowRadius = 5;
    this.castGlowAlpha = 0.8;
  }

  takeDamage(amount) {
    // No damage during i-frames
    if (this.invincible) return;

    // Accessory invulnerability (Phoenix, Barrier)
    if (this.accessorySystem && this.accessorySystem.isInvulnerable()) return;

    // Shield pylon damage reduction
    let finalAmount = amount;
    if (this.structurePool) {
      const reduction = this.structurePool.getPlayerDamageReduction(this);
      finalAmount = amount * (1 - reduction);
    }

    this.hp = Math.max(0, this.hp - finalAmount);

    // Cancel warp on damage
    if (this.gameEngine && this.gameEngine.isWarping) {
      this.gameEngine.cancelWarp();
    }

    // Screen shake
    if (this.camera) {
      this.camera.shake(4);
    }

    // Activate i-frames
    this.invincible = true;
    this.invincibilityTimer = 0;

    // Activate hit flash
    this.hitFlash = true;
    this.hitFlashTimer = 0;

    // Notify accessory system of damage taken
    if (this.accessorySystem) {
      this.accessorySystem.onPlayerDamaged();
    }

    console.log(`Player took ${finalAmount.toFixed(0)} damage. HP: ${this.hp}/${this.maxHp}`);

    if (this.hp <= 0) {
      // Phoenix Feather revive check
      if (this.accessorySystem && this.accessorySystem.onPlayerDeath()) {
        console.log('Phoenix Feather revived!');
        return;
      }
      console.log('Player died!');
    }
  }

  update(dt) {
    // Normalize diagonal movement (prevent faster diagonal speed)
    const dirLength = Math.sqrt(
      this.moveDirection.x * this.moveDirection.x +
      this.moveDirection.y * this.moveDirection.y
    );

    if (dirLength > 0) {
      const normalizedX = this.moveDirection.x / dirLength;
      const normalizedY = this.moveDirection.y / dirLength;

      const speedMod = this.accessorySystem ? this.accessorySystem.getSpeedModifier() : 1.0;
      this.vx = normalizedX * this.speed * speedMod * this.slowFactor;
      this.vy = normalizedY * this.speed * speedMod * this.slowFactor;
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    // Apply movement
    super.update(dt);

    // Clamp to world bounds (or canvas bounds as fallback)
    const boundW = this.worldWidth || this.canvasWidth;
    const boundH = this.worldHeight || this.canvasHeight;
    if (boundW > 0 && boundH > 0) {
      this.x = Math.max(this.size, Math.min(boundW - this.size, this.x));
      this.y = Math.max(this.size, Math.min(boundH - this.size, this.y));
    }

    // Update i-frames timer
    if (this.invincible) {
      this.invincibilityTimer += dt * 1000;
      if (this.invincibilityTimer >= this.invincibilityDuration) {
        this.invincible = false;
        this.invincibilityTimer = 0;
      }
    }

    // Update hit flash timer
    if (this.hitFlash) {
      this.hitFlashTimer += dt * 1000;
      if (this.hitFlashTimer >= this.hitFlashDuration) {
        this.hitFlash = false;
        this.hitFlashTimer = 0;
      }
    }

    // Update slow debuff timer
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowTimer = 0;
        this.slowFactor = 1.0;
      }
    }

    // Mana regeneration
    let regenRate = this.manaRegen;
    if (this.structurePool) {
      const boost = this.structurePool.getManaRegenBoost(this);
      regenRate += boost;
    }
    if (this.accessorySystem) {
      regenRate *= this.accessorySystem.getManaRegenModifier();
    }
    if (this.mana < this.maxMana) {
      this.mana = Math.min(this.maxMana, this.mana + regenRate * dt);
    }

    // Base HP regen with heal particles
    if (this.isInBase && this.hp < this.maxHp && this.hp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.baseHpRegen * dt);
      // Spawn green heal particles
      if (Math.random() < 0.4) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 12;
        this.healParticles.push({
          x: this.x + Math.cos(angle) * dist,
          y: this.y + Math.sin(angle) * dist,
          vy: -25 - Math.random() * 15,
          life: 0.7 + Math.random() * 0.3,
          maxLife: 0.7 + Math.random() * 0.3,
          size: 1.5 + Math.random() * 1.5,
        });
      }
    }
    // Update heal particles
    for (let i = this.healParticles.length - 1; i >= 0; i--) {
      const p = this.healParticles[i];
      p.life -= dt;
      p.y += p.vy * dt;
      p.x += (Math.random() - 0.5) * 8 * dt;
      if (p.life <= 0) this.healParticles.splice(i, 1);
    }

    // Staff particles (reduced for perf)
    if (Math.random() < 0.15) {
      this.staffParticles.push({
        x: this.x + (Math.random() - 0.5) * 10,
        y: this.y + (Math.random() - 0.5) * 10,
        life: 0.6,
        maxLife: 0.6,
        vy: -20 - Math.random() * 15,
        size: 1.5 + Math.random() * 1.5,
      });
    }
    for (let i = this.staffParticles.length - 1; i >= 0; i--) {
      const p = this.staffParticles[i];
      p.life -= dt;
      p.y += p.vy * dt;
      p.x += (Math.random() - 0.5) * 10 * dt;
      if (p.life <= 0) this.staffParticles.splice(i, 1);
    }

    // Cast glow decay
    if (this.castGlowAlpha > 0) {
      this.castGlowRadius += 80 * dt;
      this.castGlowAlpha -= 2.5 * dt;
      if (this.castGlowAlpha < 0) this.castGlowAlpha = 0;
    }
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // Phantom Decoy invisibility override
    if (this._renderAlphaOverride) {
      ctx.globalAlpha = this._renderAlphaOverride;
    }

    // Invincibility flicker effect (rapid flashing)
    if (this.invincible) {
      const flickerFrequency = 100; // ms per flicker cycle
      const flickerCycle = Math.floor(this.invincibilityTimer / flickerFrequency);
      if (flickerCycle % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }
    }

    // Hit flash effect (white flash)
    let renderColor = this.color;
    if (this.hitFlash) {
      renderColor = '#ffffff';
    }

    // Cast glow (expanding ring)
    if (this.castGlowAlpha > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.castGlowRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(126, 184, 218, ${this.castGlowAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Staff particles (floating cyan sparkles)
    for (const p of this.staffParticles) {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(126, 220, 255, ${alpha * 0.7})`;
      ctx.fill();
    }

    // Heal particles (floating green sparkles)
    for (const p of this.healParticles) {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 255, 130, ${alpha * 0.8})`;
      ctx.fill();
    }

    // Dark blue robe (bottom arc behind body)
    ctx.beginPath();
    ctx.arc(this.x, this.y + 4, this.size + 2, 0.2, Math.PI - 0.2);
    ctx.fillStyle = '#1a237e';
    ctx.fill();

    // Draw player circle (body)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = renderColor;
    ctx.fill();

    // Wizard hat
    const hatBaseY = this.y - this.size;
    const hatTipY = hatBaseY - 18;
    const hatWidth = this.size * 0.9;

    // Hat body (dark indigo triangle, slightly curved)
    ctx.beginPath();
    ctx.moveTo(this.x - hatWidth, hatBaseY);
    ctx.quadraticCurveTo(this.x - 2, hatBaseY - 6, this.x + 3, hatTipY);
    ctx.quadraticCurveTo(this.x + 2, hatBaseY - 6, this.x + hatWidth, hatBaseY);
    ctx.closePath();
    ctx.fillStyle = '#1a1a4e';
    ctx.fill();

    // Gold hat band
    ctx.beginPath();
    ctx.moveTo(this.x - hatWidth - 2, hatBaseY + 1);
    ctx.lineTo(this.x + hatWidth + 2, hatBaseY + 1);
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Sparkle at hat tip
    const sparkleTime = Date.now() / 300;
    const sparkleAlpha = 0.5 + 0.5 * Math.sin(sparkleTime);
    ctx.beginPath();
    ctx.arc(this.x + 3, hatTipY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${sparkleAlpha})`;
    ctx.fill();

    ctx.restore();
  }
}

export default Player;
