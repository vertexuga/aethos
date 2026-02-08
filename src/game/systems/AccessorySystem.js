import { ACCESSORY_CONFIG } from '../data/accessoryConfig.js';

class AccessorySystem {
  constructor(player) {
    this.player = player;
    this.accessories = {}; // { id: tier }

    // --- Swift Boots ---
    this.fireTrailParticles = [];
    this.dashCooldown = 0;
    this.lastTapDir = null;
    this.lastTapTime = 0;

    // --- Regen Pendant ---
    this.emergencyHealCooldown = 0;

    // --- Vampire Ring ---
    this.recentKills = [];

    // --- Mana Heart Amulet ---
    this.freeManaActive = false;
    this.freeManaTimer = 0;
    this.freeManaUsed = false;

    // --- Phoenix Feather ---
    this.phoenixUsed = false;
    this.invulnTimer = 0;

    // --- Guardian Barrier ---
    this.barrierActive = false;
    this.barrierTimer = 0;
    this.barrierUsed = false;
    this.barrierKnockbackDone = false;
    this.barrierRocks = [];

    // --- Guardian Soldier ---
    this.soldiers = [];
    this.soldierRespawnTimers = [];

    // --- Guardian Healer ---
    this.healer = null;
    this.healerRespawnTimer = 0;
    this.healPuddles = [];
    this.healProjectiles = [];
  }

  has(id) { return (this.accessories[id] || 0) > 0; }
  tier(id) { return this.accessories[id] || 0; }

  addAccessory(id) {
    const current = this.accessories[id] || 0;
    if (current >= 3) return false;
    this.accessories[id] = current + 1;
    this.onAccessoryChanged(id);
    return true;
  }

  onAccessoryChanged(id) {
    if (id === 'arcaneBattery') {
      const t = this.tier('arcaneBattery');
      const bonus = t === 1 ? 20 : t === 2 ? 40 : t === 3 ? 60 : 0;
      this.player.maxMana = 100 + bonus;
    }
    if (id === 'guardianSoldier') this.initSoldiers();
    if (id === 'guardianHealer') this.initHealer();
  }

  // ==================== Stat Modifiers ====================

  getSpeedModifier() {
    return this.has('swiftBoots') ? 1.2 : 1.0;
  }

  getDamageModifier() {
    const t = this.tier('powerGauntlets');
    return t > 0 ? 1 + t * 0.1 : 1.0;
  }

  rollCritical() {
    return (this.tier('powerGauntlets') >= 3 && Math.random() < 0.1) ? 2.0 : 1.0;
  }

  getManaRegenModifier() {
    const t = this.tier('manaHeartAmulet');
    if (t === 0) return 1.0;
    const threshold = t >= 2 ? 0.5 : 0.25;
    return (this.player.hp / this.player.maxHp) < threshold ? 2.0 : 1.0;
  }

  getDropCountModifier() {
    const t = this.tier('treasureCompass');
    return t > 0 ? 1 + t * 0.2 : 1.0;
  }

  rollExtraDrops() {
    const t = this.tier('luckyFoot');
    if (t >= 3 && Math.random() < 0.05) return 3;
    if (t >= 2 && Math.random() < 0.10) return 2;
    if (t >= 1 && Math.random() < 0.05) return 2;
    return 1;
  }

  isInvulnerable() {
    return this.invulnTimer > 0 || this.barrierActive;
  }

  isFreeMana() {
    return this.freeManaActive;
  }

  // ==================== Events ====================

  onEnemyKilled(enemyType) {
    const now = Date.now();

    // Vampire Ring
    const vt = this.tier('vampireRing');
    if (vt >= 1) {
      const heal = vt >= 3 ? 18 : 5;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    }
    if (vt >= 3) {
      this.recentKills.push(now);
      this.recentKills = this.recentKills.filter(t => now - t < 5000);
      if (this.recentKills.length >= 3) {
        this.player.hp = this.player.maxHp;
        this.recentKills = [];
      }
    }

    // Mana Siphon Ring
    const mst = this.tier('manaSiphonRing');
    if (mst >= 1) {
      const mana = mst === 1 ? 5 : mst === 2 ? 10 : 15;
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + mana);
      if (mst >= 3 && (enemyType === 'gravityWell' || enemyType === 'riftCaller' || enemyType === 'curseHexer')) {
        this.player.mana = Math.min(this.player.maxMana, this.player.mana + 30);
      }
    }
  }

  onPlayerHitEnemy() {
    const vt = this.tier('vampireRing');
    if (vt >= 2) {
      const heal = vt >= 3 ? 6 : 3;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    }
  }

  onPlayerDamaged() {
    // Guardian Barrier
    if (this.tier('guardianBarrier') >= 1 && !this.barrierUsed && !this.barrierActive) {
      if (this.player.hp / this.player.maxHp < 0.5) {
        this.activateBarrier();
      }
    }

    // Mana Heart Amulet tier 3
    if (this.tier('manaHeartAmulet') >= 3 && !this.freeManaUsed) {
      if (this.player.hp / this.player.maxHp < 0.25) {
        this.freeManaActive = true;
        this.freeManaTimer = 5;
        this.freeManaUsed = true;
      }
    }
  }

  onPlayerDeath(enemyPools) {
    const pt = this.tier('phoenixFeather');
    if (pt >= 1 && !this.phoenixUsed) {
      this.phoenixUsed = true;
      const pct = pt === 1 ? 0.3 : pt === 2 ? 0.5 : 1.0;
      this.player.hp = Math.ceil(this.player.maxHp * pct);
      this.player.active = true;
      if (pt >= 2) this.invulnTimer = 3;
      // Tier 3 explosion
      if (pt >= 3 && enemyPools) {
        for (const key in enemyPools) {
          for (const enemy of enemyPools[key].getActive()) {
            if (!enemy.active) continue;
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            if (dx * dx + dy * dy < 150 * 150) {
              enemy.takeDamage(30);
            }
          }
        }
      }
      return true;
    }
    return false;
  }

  // ==================== Complex Effects ====================

  activateBarrier() {
    this.barrierActive = true;
    this.barrierTimer = 5;
    this.barrierUsed = true;
    this.barrierKnockbackDone = false;
    if (this.tier('guardianBarrier') >= 3) {
      this.barrierRocks = [];
      for (let i = 0; i < 6; i++) {
        this.barrierRocks.push({ angle: (i / 6) * Math.PI * 2 });
      }
    }
  }

  tryDash(direction) {
    if (this.tier('swiftBoots') < 3 || this.dashCooldown > 0) return false;
    const now = Date.now();
    if (this.lastTapDir === direction && now - this.lastTapTime < 300) {
      this.dashCooldown = 3000;
      this.lastTapDir = null;
      return true;
    }
    this.lastTapDir = direction;
    this.lastTapTime = now;
    return false;
  }

  // ==================== Guardian Soldier ====================

  initSoldiers() {
    const t = this.tier('guardianSoldier');
    const count = t >= 3 ? 2 : 1;
    const hp = t === 1 ? 50 : t === 2 ? 100 : 150;
    const dmg = t === 1 ? 8 : t === 2 ? 15 : 20;
    this.soldiers = [];
    this.soldierRespawnTimers = [];
    for (let i = 0; i < count; i++) {
      this.soldiers.push({
        x: this.player.x + (Math.random() - 0.5) * 60,
        y: this.player.y + (Math.random() - 0.5) * 60,
        hp, maxHp: hp, damage: dmg,
        attackTimer: 0, attackCooldown: 1000,
        active: true, size: 12,
      });
      this.soldierRespawnTimers.push(0);
    }
  }

  updateSoldiers(dt, enemyPools) {
    if (!this.has('guardianSoldier')) return;
    const t = this.tier('guardianSoldier');
    const respawnTime = t === 1 ? 20 : 10;

    for (let i = 0; i < this.soldiers.length; i++) {
      const s = this.soldiers[i];
      if (!s.active) {
        this.soldierRespawnTimers[i] -= dt;
        if (this.soldierRespawnTimers[i] <= 0) {
          s.active = true;
          s.hp = s.maxHp;
          s.x = this.player.x + (Math.random() - 0.5) * 60;
          s.y = this.player.y + (Math.random() - 0.5) * 60;
        }
        continue;
      }

      s.attackTimer += dt * 1000;

      // Find nearest enemy
      let nearest = null;
      let nearestDist = 200;
      if (enemyPools) {
        for (const key in enemyPools) {
          for (const enemy of enemyPools[key].getActive()) {
            if (!enemy.active || enemy.isPhased) continue;
            const dx = enemy.x - s.x;
            const dy = enemy.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) { nearestDist = dist; nearest = enemy; }
          }
        }
      }

      if (nearest) {
        const dx = nearest.x - s.x;
        const dy = nearest.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > nearest.size + s.size) {
          s.x += (dx / dist) * 100 * dt;
          s.y += (dy / dist) * 100 * dt;
        }
        if (dist < nearest.size + s.size + 5 && s.attackTimer >= s.attackCooldown) {
          nearest.takeDamage(s.damage);
          s.attackTimer = 0;
        }
        // Take contact damage from enemy
        if (dist < nearest.size + s.size) {
          s.hp -= nearest.contactDamage * dt;
          if (s.hp <= 0) {
            s.active = false;
            this.soldierRespawnTimers[i] = respawnTime;
          }
        }
      } else {
        // Follow player
        const dx = this.player.x - s.x;
        const dy = this.player.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 60) {
          s.x += (dx / dist) * 90 * dt;
          s.y += (dy / dist) * 90 * dt;
        }
      }
    }
  }

  // ==================== Guardian Healer ====================

  initHealer() {
    this.healer = {
      x: this.player.x + 30, y: this.player.y + 30,
      hp: 60, maxHp: 60,
      healTimer: 0, healCooldown: 5000,
      puddleTimer: 0, puddleCooldown: 8000,
      active: true, size: 10,
    };
    this.healerRespawnTimer = 0;
  }

  updateHealer(dt) {
    if (!this.has('guardianHealer')) return;
    const t = this.tier('guardianHealer');

    if (!this.healer) return;
    if (!this.healer.active) {
      this.healerRespawnTimer -= dt;
      if (this.healerRespawnTimer <= 0) {
        this.healer.active = true;
        this.healer.hp = this.healer.maxHp;
        this.healer.x = this.player.x + 30;
        this.healer.y = this.player.y + 30;
      }
      return;
    }

    const h = this.healer;

    // Follow player loosely
    const dx = this.player.x - h.x;
    const dy = this.player.y - h.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 80) {
      h.x += (dx / dist) * 70 * dt;
      h.y += (dy / dist) * 70 * dt;
    }

    // Heal projectile
    h.healTimer += dt * 1000;
    if (h.healTimer >= h.healCooldown && this.player.hp < this.player.maxHp) {
      h.healTimer = 0;
      const pdx = this.player.x - h.x;
      const pdy = this.player.y - h.y;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
      this.healProjectiles.push({
        x: h.x, y: h.y,
        vx: (pdx / pdist) * 200, vy: (pdy / pdist) * 200,
        life: 2, healAmount: 10,
      });
    }

    // Puddles (tier 2+)
    if (t >= 2) {
      h.puddleTimer += dt * 1000;
      if (h.puddleTimer >= h.puddleCooldown) {
        h.puddleTimer = 0;
        this.healPuddles.push({
          x: this.player.x + (Math.random() - 0.5) * 80,
          y: this.player.y + (Math.random() - 0.5) * 80,
          life: 8, maxLife: 8, radius: 30,
          healRate: 5,
          poisonDamage: t >= 3 ? 3 : 0,
        });
      }
    }

    // Update heal projectiles
    for (let i = this.healProjectiles.length - 1; i >= 0; i--) {
      const p = this.healProjectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      const hdx = this.player.x - p.x;
      const hdy = this.player.y - p.y;
      if (hdx * hdx + hdy * hdy < (this.player.size + 5) * (this.player.size + 5)) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + p.healAmount);
        p.life = 0;
      }
      if (p.life <= 0) this.healProjectiles.splice(i, 1);
    }
  }

  updateHealPuddles(dt, enemyPools) {
    for (let i = this.healPuddles.length - 1; i >= 0; i--) {
      const puddle = this.healPuddles[i];
      puddle.life -= dt;
      if (puddle.life <= 0) { this.healPuddles.splice(i, 1); continue; }

      // Heal player
      const dx = this.player.x - puddle.x;
      const dy = this.player.y - puddle.y;
      if (dx * dx + dy * dy < puddle.radius * puddle.radius) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + puddle.healRate * dt);
      }

      // Poison enemies (tier 3)
      if (puddle.poisonDamage > 0 && enemyPools) {
        for (const key in enemyPools) {
          for (const enemy of enemyPools[key].getActive()) {
            if (!enemy.active || enemy.isPhased) continue;
            const edx = enemy.x - puddle.x;
            const edy = enemy.y - puddle.y;
            if (edx * edx + edy * edy < (puddle.radius + enemy.size) * (puddle.radius + enemy.size)) {
              enemy.takeDamage(puddle.poisonDamage * dt);
            }
          }
        }
      }
    }
  }

  // ==================== Main Update ====================

  update(dt, enemyPools) {
    // Regen Pendant
    const rt = this.tier('regenPendant');
    if (rt > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + rt * dt);
    }
    if (rt >= 3) {
      this.emergencyHealCooldown = Math.max(0, this.emergencyHealCooldown - dt);
      if (this.player.hp / this.player.maxHp < 0.3 && this.emergencyHealCooldown <= 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
        this.emergencyHealCooldown = 60;
      }
    }

    // Free mana timer
    if (this.freeManaActive) {
      this.freeManaTimer -= dt;
      if (this.freeManaTimer <= 0) this.freeManaActive = false;
    }

    // Fire trail (Swift Boots tier 2+)
    if (this.tier('swiftBoots') >= 2) {
      const spd = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy);
      if (spd > 20 && Math.random() < 0.6) {
        this.fireTrailParticles.push({
          x: this.player.x + (Math.random() - 0.5) * 8,
          y: this.player.y + (Math.random() - 0.5) * 8,
          life: 1.5, maxLife: 1.5,
          radius: 5 + Math.random() * 3,
        });
      }
    }
    for (let i = this.fireTrailParticles.length - 1; i >= 0; i--) {
      const p = this.fireTrailParticles[i];
      p.life -= dt;
      if (p.life <= 0) { this.fireTrailParticles.splice(i, 1); continue; }
      if (enemyPools) {
        for (const key in enemyPools) {
          for (const enemy of enemyPools[key].getActive()) {
            if (!enemy.active || enemy.isPhased) continue;
            const dx = enemy.x - p.x;
            const dy = enemy.y - p.y;
            if (dx * dx + dy * dy < (enemy.size + p.radius) * (enemy.size + p.radius)) {
              enemy.takeDamage(5 * dt);
            }
          }
        }
      }
    }

    // Dash cooldown
    this.dashCooldown = Math.max(0, this.dashCooldown - dt * 1000);

    // Invulnerability timer
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);

    // Guardian Barrier
    if (this.barrierActive) {
      this.barrierTimer -= dt;
      if (this.tier('guardianBarrier') >= 2 && !this.barrierKnockbackDone && enemyPools) {
        this.barrierKnockbackDone = true;
        for (const key in enemyPools) {
          for (const enemy of enemyPools[key].getActive()) {
            if (!enemy.active) continue;
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120 && dist > 0) {
              enemy.takeDamage(15);
              enemy.x += (dx / dist) * 80;
              enemy.y += (dy / dist) * 80;
            }
          }
        }
      }
      if (this.tier('guardianBarrier') >= 3) {
        for (const rock of this.barrierRocks) {
          rock.angle += dt * 3;
          const rx = this.player.x + Math.cos(rock.angle) * 50;
          const ry = this.player.y + Math.sin(rock.angle) * 50;
          if (enemyPools) {
            for (const key in enemyPools) {
              for (const enemy of enemyPools[key].getActive()) {
                if (!enemy.active || enemy.isPhased) continue;
                const dx = enemy.x - rx;
                const dy = enemy.y - ry;
                if (dx * dx + dy * dy < (enemy.size + 8) * (enemy.size + 8)) {
                  enemy.takeDamage(10 * dt);
                }
              }
            }
          }
        }
      }
      if (this.barrierTimer <= 0) {
        this.barrierActive = false;
        this.barrierRocks = [];
      }
    }

    this.updateSoldiers(dt, enemyPools);
    this.updateHealer(dt);
    this.updateHealPuddles(dt, enemyPools);
  }

  // ==================== Rendering ====================

  renderWorldEffects(ctx) {
    // Fire trail
    for (const p of this.fireTrailParticles) {
      const alpha = (p.life / p.maxLife) * 0.6;
      const r = p.radius * (p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 20, ${alpha})`;
      ctx.fill();
    }

    // Heal puddles
    for (const puddle of this.healPuddles) {
      const alpha = Math.min(0.35, (puddle.life / puddle.maxLife) * 0.35);
      ctx.beginPath();
      ctx.arc(puddle.x, puddle.y, puddle.radius, 0, Math.PI * 2);
      ctx.fillStyle = puddle.poisonDamage > 0
        ? `rgba(76, 175, 80, ${alpha})`
        : `rgba(129, 199, 132, ${alpha})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(puddle.x, puddle.y, puddle.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
      ctx.fill();
    }

    // Heal projectiles
    for (const p of this.healProjectiles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#81c784';
      ctx.fill();
    }

    // Guardian Soldiers
    for (const s of this.soldiers) {
      if (!s.active) continue;
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(141, 110, 99, 0.8)';
      ctx.fill();
      // Sword
      ctx.strokeStyle = '#bdbdbd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x + 5, s.y - 5);
      ctx.lineTo(s.x + 14, s.y - 14);
      ctx.stroke();
      // HP bar
      if (s.hp < s.maxHp) {
        const bw = 20;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(s.x - bw / 2, s.y - s.size - 6, bw, 3);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(s.x - bw / 2, s.y - s.size - 6, bw * (s.hp / s.maxHp), 3);
      }
      ctx.restore();
    }

    // Guardian Healer
    if (this.healer && this.healer.active) {
      const h = this.healer;
      ctx.save();
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(129, 199, 132, 0.7)';
      ctx.fill();
      // Cross symbol
      ctx.fillStyle = '#fff';
      ctx.fillRect(h.x - 1, h.y - 5, 2, 10);
      ctx.fillRect(h.x - 5, h.y - 1, 10, 2);
      ctx.restore();
    }

    // Guardian Barrier
    if (this.barrierActive) {
      const pulse = 0.5 + 0.3 * Math.sin(Date.now() / 200);
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, 40, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(41, 182, 246, ${0.5 * pulse})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      for (const rock of this.barrierRocks) {
        const rx = this.player.x + Math.cos(rock.angle) * 50;
        const ry = this.player.y + Math.sin(rock.angle) * 50;
        ctx.beginPath();
        ctx.arc(rx, ry, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6e40';
        ctx.fill();
      }
      ctx.restore();
    }

    // Phoenix invulnerability glow
    if (this.invulnTimer > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 100);
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.size + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 110, 64, ${0.6 * pulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  renderAccessoryHUD(ctx) {
    const ids = Object.keys(this.accessories);
    if (ids.length === 0) return;

    const startX = 10;
    const startY = ctx.canvas.height - 78;
    const iconSize = 22;
    const gap = 3;

    ctx.save();

    let x = startX;
    for (const id of ids) {
      const config = ACCESSORY_CONFIG[id];
      const t = this.accessories[id];

      // Slot bg
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, startY, iconSize, iconSize, 3);
      ctx.fill();
      ctx.stroke();

      // Emoji
      ctx.font = '13px serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.emoji, x + 3, startY + iconSize / 2 + 1);

      // Tier pip
      ctx.font = '7px monospace';
      ctx.textBaseline = 'top';
      ctx.fillStyle = t >= 3 ? '#ff6e40' : t >= 2 ? '#ffd54f' : '#b0bec5';
      ctx.fillText(`T${t}`, x + 1, startY - 9);

      // Hover tooltip
      if (this.hoverMouseX >= x && this.hoverMouseX < x + iconSize &&
          this.hoverMouseY >= startY && this.hoverMouseY < startY + iconSize) {
        this.renderAccessoryTooltip(ctx, id, t, config, x, startY);
      }

      x += iconSize + gap;
    }

    ctx.restore();
  }

  renderAccessoryTooltip(ctx, id, tier, config, slotX, slotY) {
    const tipW = 200;
    const tipH = 52;
    let tipX = slotX;
    let tipY = slotY - tipH - 6;
    if (tipX + tipW > ctx.canvas.width) tipX = ctx.canvas.width - tipW - 5;
    if (tipY < 0) tipY = slotY + 28;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 10, 22, 0.92)';
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tipX, tipY, tipW, tipH, 5);
    ctx.fill();
    ctx.stroke();

    ctx.textBaseline = 'top';
    ctx.fillStyle = config.color;
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${config.emoji} ${config.name} (Tier ${tier})`, tipX + 6, tipY + 6);

    ctx.fillStyle = 'rgba(200, 200, 220, 0.8)';
    ctx.font = '9px monospace';
    ctx.fillText(config.tiers[tier].description, tipX + 6, tipY + 22);

    if (tier < 3) {
      ctx.fillStyle = 'rgba(150, 180, 200, 0.5)';
      ctx.fillText(`Next: ${config.tiers[tier + 1].description}`, tipX + 6, tipY + 36);
    }
    ctx.restore();
  }

  // Set from RenderPipeline for tooltip hover detection
  setMousePos(x, y) {
    this.hoverMouseX = x;
    this.hoverMouseY = y;
  }
}

export default AccessorySystem;
