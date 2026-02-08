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

  // Draw edges: 0→1, 1→2, 2→0
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

// Line/swipe template generator
function generateLine(startX = 50, startY = 100, endX = 150, endY = 100, numPoints = 20) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    points.push({
      x: startX + (endX - startX) * t,
      y: startY + (endY - startY) * t
    });
  }
  return points;
}

// Generate all templates with variations
// More variations = better recognition across rotations and drawing styles
const GESTURE_TEMPLATES = [
  {
    name: 'circle',
    variations: [
      generateCircle(100, 100, 50, 64, 0),                                // CW from right
      generateCircle(100, 100, 50, 64, Math.PI / 2),                      // CW from bottom
      generateCircle(100, 100, 50, 64, Math.PI),                          // CW from left
      reversePoints(generateCircle(100, 100, 50, 64, 0)),                 // CCW from right
      addJitter(generateCircle(100, 100, 45, 48, Math.PI * 1.5), 6),     // CW from top, jittery
      addJitter(reversePoints(generateCircle(100, 100, 48, 48, Math.PI / 4)), 5), // CCW, jittery
    ]
  },
  {
    name: 'triangle',
    variations: [
      generateTriangle(100, 100, 60, 0),                     // Upright
      generateTriangle(100, 100, 60, 90),                    // Rotated 90°
      generateTriangle(100, 100, 60, 180),                   // Inverted
      generateTriangle(100, 100, 60, 270),                   // Rotated 270°
      addJitter(generateTriangle(100, 100, 55, 45), 4),      // Rotated 45°, jittery
      addJitter(generateTriangle(100, 100, 58, 135), 4),     // Rotated 135°, jittery
    ]
  },
  {
    name: 'line',
    variations: [
      generateLine(50, 100, 150, 100),           // Horizontal right
      generateLine(150, 100, 50, 100),           // Horizontal left
      generateLine(100, 50, 100, 150),           // Vertical down
      addJitter(generateLine(50, 100, 150, 100), 2),
      generateLine(50, 50, 150, 150),            // Diagonal
      generateLine(50, 150, 150, 50),            // Diagonal other way
    ]
  },
];

export default GESTURE_TEMPLATES;
