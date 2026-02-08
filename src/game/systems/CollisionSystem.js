import { getElementalMultiplier } from '../data/spellConfig.js';

class CollisionSystem {
  constructor(player, enemyPool, spellCaster) {
    this.player = player;
    this.enemyPool = enemyPool;
    this.spellCaster = spellCaster;
  }

  /**
   * Check circle-circle collision using squared distance (optimization)
   */
  checkCircleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSum = a.size + b.size;
    const radiusSumSquared = radiusSum * radiusSum;

    return distanceSquared < radiusSumSquared;
  }

  update(dt) {
    // Detection-then-response pattern
    this.detectAndResolveCollisions();
  }

  detectAndResolveCollisions() {
    const enemies = this.enemyPool.getActive();

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

    // 1. Projectile-Enemy collisions (piercing — projectiles pass through)
    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        // Skip enemies already hit by this projectile (piercing tracking)
        if (projectile.hitEnemies && projectile.hitEnemies.has(enemy.id)) continue;

        if (this.checkCircleCollision(projectile, enemy)) {
          // Calculate elemental damage multiplier
          const elemMultiplier = getElementalMultiplier(projectile.element, enemy.element);
          const damage = projectile.getDamage() * elemMultiplier;
          enemy.takeDamage(damage);

          // Track this enemy as hit (piercing — don't hit same enemy twice)
          if (!projectile.hitEnemies) projectile.hitEnemies = new Set();
          projectile.hitEnemies.add(enemy.id);

          // Piercing: do NOT destroy projectile or break — it passes through
        }
      }
    }

    // 2. Enemy-Player collisions
    for (const enemy of enemies) {
      if (!enemy.active) continue;

      if (this.checkCircleCollision(enemy, this.player)) {
        // Apply contact damage to player
        this.player.takeDamage(enemy.contactDamage);
        // Note: We don't destroy enemy on contact, it can hit multiple times
        // But player i-frames prevent rapid damage
      }
    }
  }
}

export default CollisionSystem;
