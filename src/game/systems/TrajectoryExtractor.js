class TrajectoryExtractor {
  /**
   * Extract trajectory direction from the last N points of a drawing
   * @param {Array} points - Array of {x, y} points
   * @param {number} numPoints - Number of points to analyze from the end
   * @returns {Object|null} { angle, magnitude, direction: {x, y}, origin: {x, y} } or null
   */
  static extract(points, numPoints = 5) {
    if (points.length < numPoints) return null;

    // Get last N points
    const endPoints = points.slice(-numPoints);

    // Calculate direction vector from first to last of end segment
    const dx = endPoints[endPoints.length - 1].x - endPoints[0].x;
    const dy = endPoints[endPoints.length - 1].y - endPoints[0].y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    // If magnitude too small, no meaningful direction
    if (magnitude < 10) return null;

    return {
      angle: Math.atan2(dy, dx),
      magnitude,
      direction: {
        x: dx / magnitude,
        y: dy / magnitude
      },
      origin: {
        x: endPoints[0].x,
        y: endPoints[0].y
      }
    };
  }

  /**
   * Extract trajectory from center of drawn shape outward to last point
   * @param {Array} points - Array of {x, y} points
   * @returns {Object|null} { angle, magnitude, direction: {x, y}, origin: {x, y} } or null
   */
  static extractFromCenter(points) {
    if (points.length < 2) return null;

    // Calculate centroid of all points
    let sumX = 0;
    let sumY = 0;
    for (const point of points) {
      sumX += point.x;
      sumY += point.y;
    }
    const centroid = {
      x: sumX / points.length,
      y: sumY / points.length
    };

    // Get last point
    const lastPoint = points[points.length - 1];

    // Direction = last point - centroid
    const dx = lastPoint.x - centroid.x;
    const dy = lastPoint.y - centroid.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    // If magnitude too small, no meaningful direction
    if (magnitude < 10) return null;

    return {
      angle: Math.atan2(dy, dx),
      magnitude,
      direction: {
        x: dx / magnitude,
        y: dy / magnitude
      },
      origin: centroid
    };
  }
}

export default TrajectoryExtractor;
