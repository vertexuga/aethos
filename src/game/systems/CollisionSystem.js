import { getElementalMultiplier } from '../data/spellConfig.js';

function randomDamageMultiplier() {
  return 0.8 + Math.random() * 0.4; // [0.8, 1.2]
}

class CollisionSystem {
  constructor(player, enemyPools, spellCaster) {
    this.player = player;
    this.enemyPools = enemyPools; // { slime: EnemyPool, spellThief: EnemyPool, ... }
    this.spellCaster = spellCaster;
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
  }

  getAllActiveEnemies() {
    const enemies = [];
    for (const key in this.enemyPools) {
      enemies.push(...this.enemyPools[key].getActive());
    }
    return enemies;
  }

  detectAndResolveCollisions() {
    const enemies = this.getAllActiveEnemies();

    // Get all active projectiles from all pools
    const projectiles = [];
    if (this.spellCaster.quickShotPool) {
      projectiles.push(...this.spellCaster.quickShotPool.getActive());
    }
    if (this.spellCaster.magicMissilePool) {
      projectiles.push(...this.spellCaster.magicMissilePool.getActive());
    }
    if (this.spellCaster.fireballPool) {
      projectiles.push(...this.spellCaster.fireballPool.getActive());
    }

    // 1. Projectile-Enemy collisions (piercing)
    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        // Skip enemies already hit by this projectile
        if (projectile.hitEnemies && projectile.hitEnemies.has(enemy.id)) continue;

        // Phase Wraith invulnerability check
        if (enemy.isPhased) continue;

        if (this.checkCircleCollision(projectile, enemy)) {
          const elemMultiplier = getElementalMultiplier(projectile.element, enemy.element);
          const damage = projectile.getDamage() * elemMultiplier * randomDamageMultiplier();
          enemy.takeDamage(damage);

          if (!projectile.hitEnemies) projectile.hitEnemies = new Set();
          projectile.hitEnemies.add(enemy.id);
        }
      }
    }

    // 2. Enemy-Player collisions (damage + physical push)
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (enemy.isPhased) continue; // Phase Wraith can't hurt while phased

      if (this.checkCircleCollision(enemy, this.player)) {
        // Deal contact damage
        if (enemy.contactDamage > 0) {
          this.player.takeDamage(enemy.contactDamage * randomDamageMultiplier());
        }

        // Push apart (player pushed more, enemy pushed less)
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

            // Slimes bounce back after hitting player
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
