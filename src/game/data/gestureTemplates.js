// Gesture templates for $1 Recognizer
// Each shape has multiple variations: rotations, directions, jitter

// Helper: Add random jitter to points
function addJitter(points, amount) {
  return points.map(p => ({
    x: p.x + (Math.random() - 0.5) * amount * 2,
    y: p.y + (Math.random() - 0.5) * amount * 2
  }));
}

// Helper: Rotate points around a center
function rotatePoints(points, angleDeg, centerX = 100, centerY = 100) {
  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return points.map(p => ({
    x: centerX + (p.x - centerX) * cos - (p.y - centerY) * sin,
    y: centerY + (p.x - centerX) * sin + (p.y - centerY) * cos
  }));
}

// Helper: Reverse point order (for counter-clockwise drawing)
function reversePoints(points) {
  return [...points].reverse();
}

// Circle template generator
function generateCircle(centerX = 100, centerY = 100, radius = 50, numPoints = 64, startAngle = 0) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = startAngle + (i / numPoints) * Math.PI * 2;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }
  return points;
}

// Triangle template generator (draws a closed triangle from a starting vertex)
function generateTriangle(centerX = 100, centerY = 100, size = 60, rotationDeg = 0) {
  const points = [];
  const height = size * Math.sqrt(3) / 2;

  // Base vertices (top, bottom-left, bottom-right)
  const vertices = [
    { x: centerX, y: centerY - height / 2 },
    { x: centerX - size / 2, y: centerY + height / 2 },
    { x: centerX + size / 2, y: centerY + height / 2 }
  ];

  // Draw edges: 0->1, 1->2, 2->0
  for (let edge = 0; edge < 3; edge++) {
    const from = vertices[edge];
    const to = vertices[(edge + 1) % 3];
    for (let t = 0; t <= 1; t += 0.1) {
      points.push({
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t
      });
    }
  }

  return rotationDeg === 0 ? points : rotatePoints(points, rotationDeg, centerX, centerY);
}

// Star (pentagram) template generator — draws a 5-pointed star by connecting every other vertex
function generateStar(centerX = 100, centerY = 100, radius = 50, rotationDeg = 0) {
  const points = [];
  // 5 outer vertices of a regular pentagon
  const vertices = [];
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    vertices.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }

  // Draw pentagram: connect every other vertex (0->2->4->1->3->0)
  const order = [0, 2, 4, 1, 3, 0];
  for (let e = 0; e < order.length - 1; e++) {
    const from = vertices[order[e]];
    const to = vertices[order[e + 1]];
    const steps = 12;
    for (let t = 0; t <= 1; t += 1 / steps) {
      points.push({
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t
      });
    }
  }

  return rotationDeg === 0 ? points : rotatePoints(points, rotationDeg, centerX, centerY);
}

// Line template generator — straight line from point A to B
function generateLine(centerX = 100, centerY = 100, length = 80, angleDeg = 0, numPoints = 24) {
  const points = [];
  const rad = angleDeg * Math.PI / 180;
  const startX = centerX - Math.cos(rad) * length / 2;
  const startY = centerY - Math.sin(rad) * length / 2;
  const endX = centerX + Math.cos(rad) * length / 2;
  const endY = centerY + Math.sin(rad) * length / 2;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    points.push({
      x: startX + (endX - startX) * t,
      y: startY + (endY - startY) * t
    });
  }
  return points;
}

// Generate all templates with many variations at different orientations
// More variations = better recognition accuracy
const GESTURE_TEMPLATES = [
  {
    name: 'circle',
    variations: [
      // CW at 12 starting angles (every 30°)
      ...Array.from({ length: 12 }, (_, i) =>
        generateCircle(100, 100, 50, 64, (i * 30) * Math.PI / 180)
      ),
      // CCW at 6 starting angles
      ...Array.from({ length: 6 }, (_, i) =>
        reversePoints(generateCircle(100, 100, 50, 64, (i * 60) * Math.PI / 180))
      ),
      // Jittery variations at different sizes
      addJitter(generateCircle(100, 100, 45, 48, 0), 6),
      addJitter(generateCircle(100, 100, 55, 48, Math.PI), 5),
      addJitter(reversePoints(generateCircle(100, 100, 48, 48, Math.PI / 4)), 5),
      addJitter(reversePoints(generateCircle(100, 100, 52, 48, Math.PI * 1.5)), 6),
    ]
  },
  {
    name: 'triangle',
    variations: [
      // Every 30° rotation (12 orientations)
      ...Array.from({ length: 12 }, (_, i) =>
        generateTriangle(100, 100, 60, i * 30)
      ),
      // Reversed drawing direction at key angles
      ...Array.from({ length: 6 }, (_, i) =>
        reversePoints(generateTriangle(100, 100, 60, i * 60))
      ),
      // Jittery at various rotations
      addJitter(generateTriangle(100, 100, 55, 15), 4),
      addJitter(generateTriangle(100, 100, 58, 75), 4),
      addJitter(generateTriangle(100, 100, 56, 165), 4),
      addJitter(generateTriangle(100, 100, 58, 255), 4),
    ]
  },
  {
    name: 'star',
    variations: [
      // Every 30° rotation (12 orientations)
      ...Array.from({ length: 12 }, (_, i) =>
        generateStar(100, 100, 50, i * 30)
      ),
      // Reversed drawing direction at key angles
      ...Array.from({ length: 6 }, (_, i) =>
        reversePoints(generateStar(100, 100, 50, i * 60))
      ),
      // Jittery at various rotations and sizes
      addJitter(generateStar(100, 100, 48, 18), 5),
      addJitter(generateStar(100, 100, 52, 54), 5),
      addJitter(generateStar(100, 100, 46, 108), 4),
      addJitter(generateStar(100, 100, 50, 252), 5),
    ]
  },
  {
    name: 'line',
    variations: [
      // Every 15° angle (24 orientations)
      ...Array.from({ length: 24 }, (_, i) =>
        generateLine(100, 100, 80, i * 15)
      ),
      // Reversed direction at key angles
      ...Array.from({ length: 12 }, (_, i) =>
        reversePoints(generateLine(100, 100, 80, i * 30))
      ),
      // Jittery variations
      addJitter(generateLine(100, 100, 70, 0), 4),
      addJitter(generateLine(100, 100, 90, 45), 5),
      addJitter(generateLine(100, 100, 75, 90), 4),
      addJitter(generateLine(100, 100, 85, 135), 5),
    ]
  },
];

export default GESTURE_TEMPLATES;
