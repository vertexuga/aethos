class TrajectoryExtractor {
  // Distance threshold for detecting shape closure (path returns near start)
  static CLOSURE_THRESHOLD = 50;
  // Minimum points drawn before checking for closure (prevents false positive on first few points)
  static MIN_SHAPE_POINTS = 10;
  // Path must travel at least this far from start before closure counts (prevents premature closure)
  static MIN_EXCURSION = 80;
  // Minimum distance between downsampled waypoints
  static WAYPOINT_MIN_DIST = 15;
  // Minimum tail points needed to form an arc
  static MIN_TAIL_POINTS = 3;

  /**
   * Split drawn points into shape portion and trajectory arc.
   * For closing shapes (circle, triangle): shape = points before closure, tail = points after.
   * For non-closing shapes (zigzag): shape = all points, tail = last ~25%.
   *
   * @param {Array} points - All drawn points {x, y}
   * @returns {{ shapePoints: Array, trajectory: Object|null }}
   */
  static splitAndExtract(points) {
    if (!points || points.length < 10) {
      return { shapePoints: points, trajectory: null };
    }

    // 1. Try closure detection (circle, triangle)
    const closureIdx = this.findClosurePoint(points);

    if (closureIdx !== -1 && points.length - closureIdx >= this.MIN_TAIL_POINTS) {
      const shapePoints = points.slice(0, closureIdx + 1);
      const tailPoints = points.slice(closureIdx);
      const trajectory = this.buildTrajectoryFromTail(tailPoints);
      return { shapePoints, trajectory };
    }

    // 2. No closure — detect straight tail at the end and strip it from recognition
    const tailStart = this.findStraightTail(points);

    if (tailStart < points.length) {
      const shapePoints = points.slice(0, tailStart);
      const tailPoints = points.slice(tailStart);
      const trajectory = this.buildTrajectoryFromTail(tailPoints);
      // Only use stripped shape if there are enough points left for recognition
      if (shapePoints.length >= 10) {
        return { shapePoints, trajectory };
      }
    }

    // 3. Fallback: all points to recognizer, direction from end
    const trajectory = this.extractFromEnd(points);
    return { shapePoints: points, trajectory };
  }

  /**
   * Find the index where the drawn path returns near the starting point.
   * Only checks after MIN_SHAPE_POINTS to avoid premature closure.
   */
  static findClosurePoint(points) {
    if (points.length < this.MIN_SHAPE_POINTS + this.MIN_TAIL_POINTS) return -1;

    const start = points[0];
    let maxDist = 0;

    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - start.x;
      const dy = points[i].y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      maxDist = Math.max(maxDist, dist);

      // Only detect closure after path has gone OUT (>= MIN_EXCURSION) and come BACK
      if (i >= this.MIN_SHAPE_POINTS && maxDist >= this.MIN_EXCURSION && dist < this.CLOSURE_THRESHOLD) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Walk backward from the end of the stroke to find where a straight tail begins.
   * Consecutive segments with small angle changes (< 20°) are "straight."
   * Returns the index where the straight tail starts, or points.length if no tail found.
   */
  static findStraightTail(points) {
    if (points.length < 6) return points.length;

    const ANGLE_THRESHOLD = 20 * Math.PI / 180; // 20 degrees
    const MIN_TAIL_LENGTH = 4; // need at least 4 points for a meaningful tail
    const MIN_TAIL_DIST = 15; // tail must span at least 15px total

    let tailStart = points.length;

    // Walk backward checking angle changes between consecutive segments
    for (let i = points.length - 2; i >= 1; i--) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);

      let angleDiff = Math.abs(angle2 - angle1);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

      if (angleDiff > ANGLE_THRESHOLD) {
        // Direction changed significantly — tail starts after this point
        tailStart = i + 1;
        break;
      }

      // If we've walked all the way back, the entire stroke is straight
      if (i === 1) tailStart = 0;
    }

    // Verify tail is long enough in both point count and distance
    const tailLength = points.length - tailStart;
    if (tailLength < MIN_TAIL_LENGTH) return points.length;

    const tailFirst = points[tailStart];
    const tailLast = points[points.length - 1];
    const dx = tailLast.x - tailFirst.x;
    const dy = tailLast.y - tailFirst.y;
    if (Math.sqrt(dx * dx + dy * dy) < MIN_TAIL_DIST) return points.length;

    return tailStart;
  }

  /**
   * Build trajectory from tail points (after shape closure).
   * Origin is the first tail point. Direction comes from the last segment of the tail
   * (where the user was aiming right before release).
   */
  static buildTrajectoryFromTail(tailPoints) {
    if (tailPoints.length < 2) return null;

    const origin = { x: tailPoints[0].x, y: tailPoints[0].y };
    const direction = this.directionFromEnd(tailPoints);
    if (!direction) return null;

    return {
      origin,
      direction,
      angle: Math.atan2(direction.y, direction.x),
      waypoints: null,
      hasArc: false
    };
  }

  /**
   * Fallback for non-closing shapes: centroid as origin, direction from last few points.
   */
  static extractFromEnd(points) {
    if (points.length < 2) return null;

    // Calculate centroid
    let sumX = 0, sumY = 0;
    for (const p of points) { sumX += p.x; sumY += p.y; }
    const centroid = { x: sumX / points.length, y: sumY / points.length };

    const direction = this.directionFromEnd(points);
    if (!direction) return null;

    return {
      origin: centroid,
      direction,
      angle: Math.atan2(direction.y, direction.x),
      waypoints: null,
      hasArc: false
    };
  }

  /**
   * Extract aim direction from the end of a point array.
   * Tries last 2 points first; if too close, widens until a usable direction is found.
   */
  static directionFromEnd(points) {
    const last = points[points.length - 1];

    // Try increasingly wider spans from the end
    for (let span = 2; span <= Math.min(10, points.length); span++) {
      const earlier = points[points.length - span];
      const dx = last.x - earlier.x;
      const dy = last.y - earlier.y;
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag >= 3) {
        return { x: dx / mag, y: dy / mag };
      }
    }

    // Last resort: first to last of entire array
    const first = points[0];
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag >= 1) {
      return { x: dx / mag, y: dy / mag };
    }

    return null;
  }

  /**
   * Downsample a path to keep points at least WAYPOINT_MIN_DIST apart.
   * Always includes first and last points.
   */
  static downsamplePath(points) {
    if (points.length < 2) return points.map(p => ({ x: p.x, y: p.y }));

    const result = [{ x: points[0].x, y: points[0].y }];

    for (let i = 1; i < points.length; i++) {
      const last = result[result.length - 1];
      const dx = points[i].x - last.x;
      const dy = points[i].y - last.y;
      if (Math.sqrt(dx * dx + dy * dy) >= this.WAYPOINT_MIN_DIST) {
        result.push({ x: points[i].x, y: points[i].y });
      }
    }

    // Always include the last point
    const lastPt = points[points.length - 1];
    const lastRes = result[result.length - 1];
    if (lastPt.x !== lastRes.x || lastPt.y !== lastRes.y) {
      result.push({ x: lastPt.x, y: lastPt.y });
    }

    return result;
  }
}

export default TrajectoryExtractor;
