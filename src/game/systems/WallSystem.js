import { getWallLayout } from '../data/wallConfig.js';
import { getWallSlots, DOOR_BUILD_COST, DOOR_REPAIR_COST, DOOR_HP } from '../data/wallSlotConfig.js';

class WallSystem {
  constructor(worldWidth, worldHeight) {
    this.walls = getWallLayout(worldWidth, worldHeight);
    this.animTimer = 0;

    // Buildable door slots (start empty)
    this.wallSlots = getWallSlots(worldWidth, worldHeight).map(slot => ({
      ...slot,
      built: false,
      hp: 0,
      maxHp: DOOR_HP,
      destructible: true,
    }));
  }

  getWalls() {
    return this.walls;
  }

  getWallSlots() {
    return this.wallSlots;
  }

  getBuildCost() {
    return DOOR_BUILD_COST;
  }

  getRepairCost() {
    return DOOR_REPAIR_COST;
  }

  buildWallSlot(slot) {
    if (slot.built) return false;
    slot.built = true;
    slot.hp = slot.maxHp;
    // Add to active walls array for collision detection
    this.walls.push(slot);
    return true;
  }

  repairWallSlot(slot) {
    if (!slot.built || slot.hp >= slot.maxHp) return false;
    slot.hp = slot.maxHp;
    return true;
  }

  getNearestUnbuiltDoorInRange(x, y, range) {
    let nearest = null;
    let nearestDist = range;
    for (const slot of this.wallSlots) {
      if (slot.built) continue;
      const cx = slot.x + slot.w / 2;
      const cy = slot.y + slot.h / 2;
      const dx = cx - x;
      const dy = cy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = slot;
      }
    }
    return nearest;
  }

  // Keep old name as alias
  getNearestUnbuiltSlotInRange(x, y, range) {
    return this.getNearestUnbuiltDoorInRange(x, y, range);
  }

  getNearestDamagedDoorInRange(x, y, range) {
    let nearest = null;
    let nearestDist = range;
    for (const slot of this.wallSlots) {
      if (!slot.built || slot.hp >= slot.maxHp) continue;
      const cx = slot.x + slot.w / 2;
      const cy = slot.y + slot.h / 2;
      const dx = cx - x;
      const dy = cy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = slot;
      }
    }
    return nearest;
  }

  // Keep old name as alias
  getNearestDamagedWallInRange(x, y, range) {
    return this.getNearestDamagedDoorInRange(x, y, range);
  }

  update(dt) {
    this.animTimer += dt;
  }

  wallTakeDamage(wall, amount) {
    if (!wall.destructible) return;
    wall.hp = Math.max(0, wall.hp - amount);
    if (wall.hp <= 0) {
      this.removeWall(wall);
    }
  }

  removeWall(wall) {
    const idx = this.walls.indexOf(wall);
    if (idx !== -1) {
      this.walls.splice(idx, 1);
    }
    // If this was a buildable slot, mark as unbuilt (so it can be rebuilt)
    if (this.wallSlots.includes(wall)) {
      wall.built = false;
      wall.hp = 0;
    }
  }

  resolveCircleWallCollision(entity, isPlayer = false) {
    const eSize = entity.size;
    for (const wall of this.walls) {
      // Doors let the player pass through
      if (isPlayer && wall.isDoor) continue;

      // Quick AABB rejection
      if (entity.x + eSize < wall.x || entity.x - eSize > wall.x + wall.w ||
          entity.y + eSize < wall.y || entity.y - eSize > wall.y + wall.h) continue;

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
          // Entity center is inside wall — push out gradually to nearest edge
          const cx = entity.x - wall.x;
          const cy = entity.y - wall.y;
          const pushLeft = cx + entity.size;
          const pushRight = wall.w - cx + entity.size;
          const pushUp = cy + entity.size;
          const pushDown = wall.h - cy + entity.size;

          const minPush = Math.min(pushLeft, pushRight, pushUp, pushDown);
          // Clamp push to avoid large jumps — push at most 4px per frame
          const clampedPush = Math.min(minPush, 4);
          if (minPush === pushLeft) entity.x -= clampedPush;
          else if (minPush === pushRight) entity.x += clampedPush;
          else if (minPush === pushUp) entity.y -= clampedPush;
          else entity.y += clampedPush;
        }
      }
    }
  }

  /**
   * Check if entity is touching any wall. Returns the wall if so, null otherwise.
   */
  getCollidingWall(entity) {
    for (const wall of this.walls) {
      const closestX = Math.max(wall.x, Math.min(entity.x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(entity.y, wall.y + wall.h));
      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const distSq = dx * dx + dy * dy;
      const threshold = entity.size + 4; // slightly larger than collision
      if (distSq < threshold * threshold) {
        return wall;
      }
    }
    return null;
  }

  steerAroundWalls(entity, targetX, targetY) {
    const steerDist = entity.size + 6;

    for (const wall of this.walls) {
      // Quick AABB rejection
      if (entity.x + steerDist < wall.x || entity.x - steerDist > wall.x + wall.w ||
          entity.y + steerDist < wall.y || entity.y - steerDist > wall.y + wall.h) continue;

      const closestX = Math.max(wall.x, Math.min(entity.x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(entity.y, wall.y + wall.h));
      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < steerDist * steerDist && distSq > 0.01) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        const dot = entity.vx * nx + entity.vy * ny;
        if (dot < 0) {
          entity.vx -= nx * dot;
          entity.vy -= ny * dot;

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
      // Player projectiles pass through doors
      if (wall.isDoor) continue;

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

  render(ctx, camera) {
    const time = this.animTimer;
    const pulse = 0.5 + 0.3 * Math.sin(time * 2.5);

    // Viewport culling bounds (with padding for borders)
    const pad = 10;
    const vpLeft = camera ? camera.x - pad : -Infinity;
    const vpTop = camera ? camera.y - pad : -Infinity;
    const vpRight = camera ? camera.x + camera.viewWidth + pad : Infinity;
    const vpBottom = camera ? camera.y + camera.viewHeight + pad : Infinity;

    ctx.save();

    for (const wall of this.walls) {
      // Skip walls outside viewport
      if (wall.x + wall.w < vpLeft || wall.x > vpRight ||
          wall.y + wall.h < vpTop || wall.y > vpBottom) continue;

      if (wall.isDoor && wall.built) {
        // Door rendering: slightly translucent with archway
        ctx.fillStyle = 'rgba(40, 80, 140, 0.35)';
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

        // Archway lines on top edge
        ctx.strokeStyle = `rgba(100, 180, 255, ${0.5 + pulse * 0.2})`;
        ctx.lineWidth = 1.5;

        // Draw arch on the longer side
        if (wall.w > wall.h) {
          ctx.beginPath();
          ctx.moveTo(wall.x + 3, wall.y);
          ctx.quadraticCurveTo(wall.x + wall.w / 2, wall.y - 6, wall.x + wall.w - 3, wall.y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(wall.x, wall.y + 3);
          ctx.quadraticCurveTo(wall.x - 6, wall.y + wall.h / 2, wall.x, wall.y + wall.h - 3);
          ctx.stroke();
        }

        // Border
        ctx.strokeStyle = `rgba(100, 180, 255, ${0.3 + pulse * 0.2})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

        // Always show HP bar for doors
        const hpPercent = wall.hp / wall.maxHp;
        const barW = Math.max(wall.w, wall.h);
        const barH = 3;
        const barX = wall.x + wall.w / 2 - barW / 2;
        const barY = wall.y - 6;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barW, barH);

        let barColor = hpPercent > 0.6 ? '#4caf50' : hpPercent > 0.3 ? '#ffc107' : '#f44336';
        ctx.fillStyle = barColor;
        ctx.fillRect(barX, barY, barW * hpPercent, barH);

        continue;
      }

      // Indestructible walls (dungeon) — simple fast render (fill + border only)
      if (!wall.destructible) {
        ctx.fillStyle = 'rgba(15, 20, 40, 0.7)';
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        ctx.strokeStyle = `rgba(80, 160, 255, ${0.4 + pulse * 0.25})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
        continue;
      }

      // Destructible wall rendering (base walls)
      ctx.fillStyle = 'rgba(15, 20, 40, 0.7)';
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

      // Crack visuals based on HP
      if (wall.hp < wall.maxHp) {
        const hpPercent = wall.hp / wall.maxHp;

        if (hpPercent < 0.8) {
          ctx.save();
          ctx.strokeStyle = `rgba(255, 100, 50, ${0.3 + (1 - hpPercent) * 0.4})`;
          ctx.lineWidth = 1;
          const crackCount = hpPercent < 0.3 ? 4 : hpPercent < 0.6 ? 2 : 1;
          for (let i = 0; i < crackCount; i++) {
            const startX = wall.x + wall.w * (0.2 + i * 0.2);
            const startY = wall.y + wall.h * 0.1;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + 5, startY + wall.h * 0.4);
            ctx.lineTo(startX - 3, startY + wall.h * 0.7);
            ctx.lineTo(startX + 2, startY + wall.h * 0.9);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Inner energy lines (dashed) — only for base destructible walls
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = `rgba(80, 140, 255, ${0.15 + pulse * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wall.x + 3, wall.y + wall.h / 2);
      ctx.lineTo(wall.x + wall.w - 3, wall.y + wall.h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Wall border color based on HP
      let borderColor;
      if (wall.hp < wall.maxHp) {
        const hpPercent = wall.hp / wall.maxHp;
        if (hpPercent > 0.6) {
          borderColor = `rgba(80, 160, 255, ${0.4 + pulse * 0.25})`;
        } else if (hpPercent > 0.3) {
          borderColor = `rgba(255, 193, 7, ${0.4 + pulse * 0.25})`;
        } else {
          borderColor = `rgba(244, 67, 54, ${0.4 + pulse * 0.25})`;
        }
      } else {
        borderColor = `rgba(80, 160, 255, ${0.4 + pulse * 0.25})`;
      }

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

      // HP bar for damaged walls
      if (wall.hp < wall.maxHp) {
        const hpPercent = wall.hp / wall.maxHp;
        const barW = Math.max(wall.w, wall.h);
        const barH = 3;
        const barX = wall.x + wall.w / 2 - barW / 2;
        const barY = wall.y - 6;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barW, barH);

        let barColor = hpPercent > 0.6 ? '#4caf50' : hpPercent > 0.3 ? '#ffc107' : '#f44336';
        ctx.fillStyle = barColor;
        ctx.fillRect(barX, barY, barW * hpPercent, barH);
      }
    }

    // Render ghost outlines for unbuilt door slots
    for (const slot of this.wallSlots) {
      if (slot.built) continue;

      // Viewport cull door slots too
      if (slot.x + slot.w < vpLeft || slot.x > vpRight ||
          slot.y + slot.h < vpTop || slot.y > vpBottom) continue;

      ctx.globalAlpha = 0.2 + 0.1 * Math.sin(time * 2);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);

      ctx.fillStyle = 'rgba(100, 180, 255, 0.3)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DOOR', slot.x + slot.w / 2, slot.y + slot.h / 2 + 3);
      ctx.textAlign = 'left';

      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}

export default WallSystem;
