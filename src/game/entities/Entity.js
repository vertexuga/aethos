class Entity {
  static idCounter = 0;

  constructor({ x, y, vx = 0, vy = 0, size = 10, type = 'generic', color = '#4a8f8f' }) {
    this.id = `entity_${Entity.idCounter++}`;
    this.x = x;
    this.y = y;
    this.vx = vx; // pixels per second
    this.vy = vy; // pixels per second
    this.size = size;
    this.type = type;
    this.color = color;
    this.active = true;

    // Waypoint arc following (set by projectiles with arc trajectories)
    this.waypoints = null;
    this.waypointIdx = 0;
    this.waypointProgress = 0;
    this.waypointsDone = false;
  }

  update(dt) {
    // dt is in seconds (already divided by 1000 in game loop)
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /**
   * Follow waypoint arc path at this.speed px/sec.
   * Returns true if still following waypoints, false if done (or no waypoints).
   * When done, sets vx/vy to the last arc direction so the projectile continues straight.
   */
  followWaypoints(dt) {
    if (!this.waypoints || this.waypoints.length < 2 || this.waypointsDone) return false;

    let remaining = this.speed * dt;

    while (remaining > 0 && this.waypointIdx < this.waypoints.length - 1) {
      const from = this.waypoints[this.waypointIdx];
      const to = this.waypoints[this.waypointIdx + 1];
      const segDx = to.x - from.x;
      const segDy = to.y - from.y;
      const segLen = Math.sqrt(segDx * segDx + segDy * segDy);

      if (segLen < 0.001) {
        this.waypointIdx++;
        this.waypointProgress = 0;
        continue;
      }

      const remainingInSeg = segLen * (1 - this.waypointProgress);

      if (remaining >= remainingInSeg) {
        remaining -= remainingInSeg;
        this.waypointIdx++;
        this.waypointProgress = 0;
      } else {
        this.waypointProgress += remaining / segLen;
        remaining = 0;
      }
    }

    if (this.waypointIdx < this.waypoints.length - 1) {
      // Interpolate position along current segment
      const from = this.waypoints[this.waypointIdx];
      const to = this.waypoints[this.waypointIdx + 1];
      this.x = from.x + (to.x - from.x) * this.waypointProgress;
      this.y = from.y + (to.y - from.y) * this.waypointProgress;

      // Update velocity direction for rendering (rotation etc.)
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        this.vx = (dx / len) * this.speed;
        this.vy = (dy / len) * this.speed;
      }
      return true;
    }

    // Done with waypoints — set exit velocity from last segment
    this.waypointsDone = true;
    const n = this.waypoints.length;
    this.x = this.waypoints[n - 1].x;
    this.y = this.waypoints[n - 1].y;

    if (n >= 2) {
      const dx = this.waypoints[n - 1].x - this.waypoints[n - 2].x;
      const dy = this.waypoints[n - 1].y - this.waypoints[n - 2].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        this.vx = (dx / len) * this.speed;
        this.vy = (dy / len) * this.speed;
      }
    }
    return false;
  }

  render(ctx, interpolation) {
    if (!this.active) return;

    // Draw filled circle with subtle glow
    ctx.save();

    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.restore();
  }

  destroy() {
    this.active = false;
  }
}

export default Entity;
