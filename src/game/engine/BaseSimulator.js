/**
 * BaseSimulator — simplified background simulation for the base while player is in dungeon.
 * Runs at ~4 ticks/sec: enemy movement toward crystal, turret fire, wall damage, crystal damage.
 * No rendering or particles.
 */
class BaseSimulator {
  constructor() {
    this.tickInterval = 0.25; // 4 ticks per second
    this.tickAccumulator = 0;
  }

  update(dt, enemyPools, crystal, wallSystem, structurePool) {
    if (!crystal || !crystal.active) return;

    this.tickAccumulator += dt;
    if (this.tickAccumulator < this.tickInterval) return;

    const tickDt = this.tickAccumulator;
    this.tickAccumulator = 0;

    // Update enemies — simplified movement toward crystal (base zone only)
    for (const key in enemyPools) {
      for (const enemy of enemyPools[key].getActive()) {
        if (!enemy.active || enemy._zone !== 'base') continue;

        const dx = crystal.x - enemy.x;
        const dy = crystal.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > enemy.size + crystal.size) {
          // Move toward crystal
          const speed = enemy.speed || 60;
          enemy.x += (dx / dist) * speed * tickDt;
          enemy.y += (dy / dist) * speed * tickDt;
        }

        // Wall collision/attack
        if (wallSystem) {
          const collidingWall = wallSystem.getCollidingWall(enemy);
          if (collidingWall && collidingWall.destructible) {
            // Attack wall
            wallSystem.wallTakeDamage(collidingWall, (enemy.contactDamage || 5) * tickDt);
          }
          wallSystem.resolveCircleWallCollision(enemy);
        }

        // Crystal contact damage (reduced in sim — turrets and walls defend)
        const cdx = enemy.x - crystal.x;
        const cdy = enemy.y - crystal.y;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
        if (cdist < enemy.size + crystal.size && enemy.contactDamage > 0) {
          crystal.takeDamage(enemy.contactDamage * tickDt * 0.3);
          // Push enemy away
          if (cdist > 0.01) {
            const nx = cdx / cdist;
            const ny = cdy / cdist;
            enemy.x += nx * (enemy.size + crystal.size - cdist);
            enemy.y += ny * (enemy.size + crystal.size - cdist);
          }
        }
      }
    }

    // Turret fire (structures)
    if (structurePool) {
      structurePool.update(tickDt, enemyPools);
    }

    // Crystal regen
    crystal.update(tickDt);

    // Clean up dead enemies
    for (const key in enemyPools) {
      enemyPools[key].update(0); // Just cleanup, no real dt
    }
  }
}

export default BaseSimulator;
