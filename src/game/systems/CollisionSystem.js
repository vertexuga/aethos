function randomDamageMultiplier() {
  return 0.8 + Math.random() * 0.4; // [0.8, 1.2]
}

class CollisionSystem {
  constructor(player, enemyPools, spellCaster) {
    this.player = player;
    this.enemyPools = enemyPools;
    this.spellCaster = spellCaster;
    this.crystal = null;
    this._activeZone = 'base';
  }

  setActiveZone(zone) {
    this._activeZone = zone;
  }

  setCrystal(crystal) {
    this.crystal = crystal;
  }

  checkCircleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSum = a.size + b.size;
    return distanceSquared < radiusSum * radiusSum;
  }

  update(dt) {
    this.detectAndResolveCollisions();
    this.checkEnemyCrystalCollisions(dt);
    this.applyPuddleSlows();
    this.updateEnemyStuns(dt);
  }

  checkEnemyCrystalCollisions(dt) {
    if (!this.crystal || !this.crystal.active) return;

    const enemies = this.getAllActiveEnemies();
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (enemy.isPhased) continue;

      const dx = enemy.x - this.crystal.x;
      const dy = enemy.y - this.crystal.y;
      const distSq = dx * dx + dy * dy;
      const minDist = enemy.size + this.crystal.size;

      if (distSq < minDist * minDist) {
        // Crystal takes contact damage (DPS-based)
        if (enemy.contactDamage > 0) {
          this.crystal.takeDamage(enemy.contactDamage * dt);
        }

        // Push enemy away from crystal
        const dist = Math.sqrt(distSq);
        if (dist > 0.01) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          enemy.x += nx * overlap;
          enemy.y += ny * overlap;
        }
      }
    }
  }

  getAllActiveEnemies() {
    const enemies = [];
    const zone = this._activeZone;
    for (const key in this.enemyPools) {
      for (const enemy of this.enemyPools[key].getActive()) {
        if (enemy._zone === zone) enemies.push(enemy);
      }
    }
    return enemies;
  }

  detectAndResolveCollisions() {
    const enemies = this.getAllActiveEnemies();

    // Get all active projectiles from all pools
    const piercingProjectiles = [];
    const waterBombs = [];
    const earthWaves = [];

    if (this.spellCaster.seekingMissilePool) {
      piercingProjectiles.push(...this.spellCaster.seekingMissilePool.getActive());
    }
    if (this.spellCaster.basicAttackPool) {
      piercingProjectiles.push(...this.spellCaster.basicAttackPool.getActive());
    }
    if (this.spellCaster.waterBombPool) {
      waterBombs.push(...this.spellCaster.waterBombPool.getActive());
    }
    if (this.spellCaster.earthWavePool) {
      earthWaves.push(...this.spellCaster.earthWavePool.getActive());
    }

    // 1a. Piercing projectiles vs enemies (seeking missile + basic attack)
    for (const projectile of piercingProjectiles) {
      if (!projectile.active) continue;

      for (const enemy of enemies) {
        if (!enemy.active) continue;
        if (projectile.hitEnemies && projectile.hitEnemies.has(enemy.id)) continue;
        if (enemy.isPhased) continue;

        if (this.checkCircleCollision(projectile, enemy)) {
          let damage = projectile.getDamage() * randomDamageMultiplier();

          if (this.player.accessorySystem) {
            damage *= this.player.accessorySystem.getDamageModifier();
            damage *= this.player.accessorySystem.rollCritical();
          }

          enemy.takeDamage(damage);

          if (this.player.accessorySystem) {
            this.player.accessorySystem.onPlayerHitEnemy();
          }

          if (!projectile.hitEnemies) projectile.hitEnemies = new Set();
          projectile.hitEnemies.add(enemy.id);
        }
      }
    }

    // 1b. Water Bomb vs enemies (NOT piercing — explodes on first contact)
    for (const bomb of waterBombs) {
      if (!bomb.active || bomb.hasExploded) continue;

      for (const enemy of enemies) {
        if (!enemy.active) continue;
        if (enemy.isPhased) continue;

        if (this.checkCircleCollision(bomb, enemy)) {
          // Deal direct damage to hit enemy
          let damage = bomb.getDamage() * randomDamageMultiplier();

          if (this.player.accessorySystem) {
            damage *= this.player.accessorySystem.getDamageModifier();
            damage *= this.player.accessorySystem.rollCritical();
          }

          enemy.takeDamage(damage);

          if (this.player.accessorySystem) {
            this.player.accessorySystem.onPlayerHitEnemy();
          }

          // Splash damage to nearby enemies
          const splashRadius = bomb.splashRadius || 80;
          for (const other of enemies) {
            if (!other.active || other === enemy) continue;
            if (other.isPhased) continue;
            const sdx = other.x - bomb.x;
            const sdy = other.y - bomb.y;
            if (sdx * sdx + sdy * sdy < splashRadius * splashRadius) {
              let splashDamage = bomb.getDamage() * 0.5 * randomDamageMultiplier();
              other.takeDamage(splashDamage);
            }
          }

          // Trigger explosion + puddle
          bomb.onHit(enemy);
          break; // Only hit first enemy
        }
      }
    }

    // 1c. Earth Wave vs enemies (ring collision, stun, one hit per enemy)
    for (const wave of earthWaves) {
      if (!wave.active) continue;

      for (const enemy of enemies) {
        if (!enemy.active) continue;
        if (enemy.isPhased) continue;
        if (wave.hitEnemies.has(enemy.id)) continue;

        if (wave.isEnemyInRing(enemy.x, enemy.y, enemy.size)) {
          let damage = wave.getDamage() * randomDamageMultiplier();

          if (this.player.accessorySystem) {
            damage *= this.player.accessorySystem.getDamageModifier();
            damage *= this.player.accessorySystem.rollCritical();
          }

          enemy.takeDamage(damage);

          // Apply stun
          if (enemy.stunTimer !== undefined) {
            enemy.stunTimer = (wave.stunDuration || 1500) / 1000;
          }

          if (this.player.accessorySystem) {
            this.player.accessorySystem.onPlayerHitEnemy();
          }

          wave.hitEnemies.add(enemy.id);
        }
      }
    }

    // 2. Enemy-Player collisions (damage + physical push)
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (enemy.isPhased) continue;

      if (this.checkCircleCollision(enemy, this.player)) {
        if (enemy.contactDamage > 0) {
          this.player.takeDamage(enemy.contactDamage * randomDamageMultiplier());
        }

        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const minDist = this.player.size + enemy.size;
          const overlap = minDist - dist;
          if (overlap > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            this.player.x += nx * overlap * 0.7;
            this.player.y += ny * overlap * 0.7;
            enemy.x -= nx * overlap * 0.3;
            enemy.y -= ny * overlap * 0.3;

            if (enemy.type === 'enemy-slime' && enemy.mergeState === 'none') {
              enemy.vx = -nx * 200;
              enemy.vy = -ny * 200;
              if (enemy.dashState === 'dashing' || enemy.dashState === 'charging') {
                enemy.dashState = 'cooldown';
                enemy.dashTimer = 0;
              }
            }
          }
        }
      }
    }

    // 3. Enemy-Enemy push apart
    this.resolveEnemyEnemyCollisions(enemies);
  }

  applyPuddleSlows() {
    if (!this.spellCaster) return;
    const puddles = this.spellCaster.getActivePuddles();
    if (puddles.length === 0) return;

    const enemies = this.getAllActiveEnemies();
    for (const enemy of enemies) {
      if (!enemy.active) continue;

      let inPuddle = false;
      for (const puddle of puddles) {
        const dx = enemy.x - puddle.x;
        const dy = enemy.y - puddle.y;
        if (dx * dx + dy * dy < puddle.radius * puddle.radius) {
          inPuddle = true;
          if (enemy.slowFactor !== undefined) {
            enemy.slowFactor = puddle.slowFactor;
          }
          break;
        }
      }

      if (!inPuddle && enemy.slowFactor !== undefined) {
        enemy.slowFactor = 1.0;
      }
    }
  }

  updateEnemyStuns(dt) {
    const enemies = this.getAllActiveEnemies();
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (enemy.stunTimer !== undefined && enemy.stunTimer > 0) {
        enemy.stunTimer -= dt;
        if (enemy.stunTimer < 0) enemy.stunTimer = 0;
      }
    }
  }

  resolveEnemyEnemyCollisions(enemies) {
    const strength = 0.5;
    for (let i = 0; i < enemies.length; i++) {
      const a = enemies[i];
      if (!a.active) continue;
      for (let j = i + 1; j < enemies.length; j++) {
        const b = enemies[j];
        if (!b.active) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const minDist = a.size + b.size;

        if (distSq < minDist * minDist && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const push = overlap * strength;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }
}

export default CollisionSystem;
