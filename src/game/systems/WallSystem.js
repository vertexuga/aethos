import { getWallLayout } from '../data/wallConfig.js';

class WallSystem {
  constructor(worldWidth, worldHeight) {
    this.walls = getWallLayout(worldWidth, worldHeight);
    this.animTimer = 0;
  }

  getWalls() {
    return this.walls;
  }

  update(dt) {
    this.animTimer += dt;
  }

  resolveCircleWallCollision(entity) {
    for (const wall of this.walls) {
      // Find closest point on AABB to circle center
      const closestX = Math.max(wall.x, Math.min(entity.x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(entity.y, wall.y + wall.h));

      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < entity.size * entity.size) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.01) {
          const overlap = entity.size - dist;
          entity.x += (dx / dist) * overlap;
          entity.y += (dy / dist) * overlap;
        } else {
          // Entity center is inside wall — push out to nearest edge
          const cx = entity.x - wall.x;
          const cy = entity.y - wall.y;
          const pushLeft = cx + entity.size;
          const pushRight = wall.w - cx + entity.size;
          const pushUp = cy + entity.size;
          const pushDown = wall.h - cy + entity.size;

          const minPush = Math.min(pushLeft, pushRight, pushUp, pushDown);
          if (minPush === pushLeft) entity.x = wall.x - entity.size;
          else if (minPush === pushRight) entity.x = wall.x + wall.w + entity.size;
          else if (minPush === pushUp) entity.y = wall.y - entity.size;
          else entity.y = wall.y + wall.h + entity.size;
        }
      }
    }
  }

  /**
   * Redirect entity velocity to slide around walls instead of getting stuck.
   * Call BEFORE position update (Entity.update applies vx/vy).
   */
  steerAroundWalls(entity, targetX, targetY) {
    const steerDist = entity.size + 6;

    for (const wall of this.walls) {
      const closestX = Math.max(wall.x, Math.min(entity.x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(entity.y, wall.y + wall.h));
      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < steerDist * steerDist && distSq > 0.01) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        // Only steer if velocity is going into this wall
        const dot = entity.vx * nx + entity.vy * ny;
        if (dot < 0) {
          // Remove velocity component going into wall (keep tangent)
          entity.vx -= nx * dot;
          entity.vy -= ny * dot;

          // If tangential component is too small, nudge perpendicular toward target
          const tangentSpeed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
          const speed = entity.speed || 80;

          if (tangentSpeed < speed * 0.3) {
            const tx = -ny;
            const ty = nx;
            const toTargetX = targetX - entity.x;
            const toTargetY = targetY - entity.y;
            const dotT = tx * toTargetX + ty * toTargetY;

            if (dotT >= 0) {
              entity.vx += tx * speed * 0.8;
              entity.vy += ty * speed * 0.8;
            } else {
              entity.vx -= tx * speed * 0.8;
              entity.vy -= ty * speed * 0.8;
            }
          }

          // Re-normalize to maintain original speed
          const newSpeed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
          if (newSpeed > 0.01) {
            entity.vx = (entity.vx / newSpeed) * speed;
            entity.vy = (entity.vy / newSpeed) * speed;
          }
        }
      }
    }
  }

  checkProjectileWallCollision(projectile) {
    for (const wall of this.walls) {
      const closestX = Math.max(wall.x, Math.min(projectile.x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(projectile.y, wall.y + wall.h));

      const dx = projectile.x - closestX;
      const dy = projectile.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < projectile.size * projectile.size) {
        return true;
      }
    }
    return false;
  }

  render(ctx) {
    const time = this.animTimer;
    const pulse = 0.5 + 0.3 * Math.sin(time * 2.5);

    ctx.save();

    for (const wall of this.walls) {
      // Dark semi-transparent fill
      ctx.fillStyle = 'rgba(15, 20, 40, 0.7)';
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

      // Inner energy lines (dashed)
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = `rgba(80, 140, 255, ${0.15 + pulse * 0.1})`;
      ctx.lineWidth = 1;
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(wall.x + 3, wall.y + wall.h / 2);
      ctx.lineTo(wall.x + wall.w - 3, wall.y + wall.h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Pulsing blue glow border
      ctx.shadowBlur = 8 + pulse * 6;
      ctx.shadowColor = `rgba(60, 120, 255, ${0.4 + pulse * 0.3})`;
      ctx.strokeStyle = `rgba(80, 160, 255, ${0.4 + pulse * 0.25})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}

export default WallSystem;
