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

// Zigzag template generator
function generateZigzag(startX = 50, startY = 80, length = 100, peaks = 3, amplitude = 30, rotationDeg = 0) {
  const points = [];
  const segmentWidth = length / peaks;

  for (let i = 0; i <= peaks; i++) {
    const x = startX + i * segmentWidth;
    const y = i % 2 === 0 ? startY : startY + amplitude;

    if (i > 0) {
      const prevX = startX + (i - 1) * segmentWidth;
      const prevY = (i - 1) % 2 === 0 ? startY : startY + amplitude;

      for (let t = 0.2; t < 1; t += 0.2) {
        points.push({
          x: prevX + (x - prevX) * t,
          y: prevY + (y - prevY) * t
        });
      }
    }

    points.push({ x, y });
  }

  return rotationDeg === 0 ? points : rotatePoints(points, rotationDeg, startX + length / 2, startY + amplitude / 2);
}

// Spiral template generator
function generateSpiral(centerX = 100, centerY = 100, startRadius = 50, turns = 2, numPoints = 40) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const angle = t * Math.PI * 2 * turns;
    const radius = startRadius * (1 - t * 0.8);

    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }
  return points;
}

// Circle-dot template generator (circle with center dot)
function generateCircleDot(centerX = 100, centerY = 100, radius = 50, dotRadius = 5) {
  const points = [];

  for (let i = 0; i <= 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }

  points.push({ x: centerX, y: centerY });

  for (let i = 0; i <= 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    points.push({
      x: centerX + Math.cos(angle) * dotRadius,
      y: centerY + Math.sin(angle) * dotRadius
    });
  }

  return points;
}

// Horizontal swipe template (hold)
function generateHorizontalSwipe(startX = 50, startY = 100, length = 120, numPoints = 25) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    points.push({
      x: startX + length * t,
      y: startY
    });
  }
  return points;
}

// Star template generator (5-pointed)
function generateStar(centerX = 100, centerY = 100, outerRadius = 50, innerRadius = 20) {
  const points = [];
  const numPoints = 10;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    if (i > 0) {
      const prevAngle = ((i - 1) / numPoints) * Math.PI * 2 - Math.PI / 2;
      const prevRadius = (i - 1) % 2 === 0 ? outerRadius : innerRadius;
      const prevX = centerX + Math.cos(prevAngle) * prevRadius;
      const prevY = centerY + Math.sin(prevAngle) * prevRadius;

      for (let t = 0.25; t < 1; t += 0.25) {
        points.push({
          x: prevX + (x - prevX) * t,
          y: prevY + (y - prevY) * t
        });
      }
    }

    points.push({ x, y });
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
  {
    name: 'zigzag',
    variations: [
      generateZigzag(50, 60, 120, 4, 60, 0),             // Horizontal, 4 peaks
      generateZigzag(50, 60, 120, 3, 65, 0),             // Horizontal, 3 peaks
      generateZigzag(50, 60, 120, 4, 60, 90),            // Vertical
      generateZigzag(50, 60, 120, 4, 60, 45),            // Diagonal
      addJitter(generateZigzag(50, 60, 115, 4, 55, 0), 3),
      reversePoints(generateZigzag(50, 60, 120, 4, 60, 0)),  // Right-to-left
    ]
  },
  {
    name: 'spiral',
    variations: [
      generateSpiral(100, 100, 50, 2),
      addJitter(generateSpiral(100, 100, 50, 2.2), 2),
      reversePoints(generateSpiral(100, 100, 50, 2)),     // Outward spiral
      generateSpiral(100, 100, 48, 1.8)
    ]
  },
  {
    name: 'circle-dot',
    variations: [
      generateCircleDot(100, 100, 50, 5),
      addJitter(generateCircleDot(100, 100, 50, 5), 2),
      generateCircleDot(100, 100, 48, 6)
    ]
  },
  {
    name: 'horizontal-swipe',
    variations: [
      generateHorizontalSwipe(50, 100, 120),
      addJitter(generateHorizontalSwipe(50, 100, 120), 2),
      generateHorizontalSwipe(45, 105, 125)
    ]
  },
  {
    name: 'star',
    variations: [
      generateStar(100, 100, 50, 20),
      addJitter(generateStar(100, 100, 50, 20), 3),
      rotatePoints(generateStar(100, 100, 50, 20), 36),   // Rotated one point
      generateStar(100, 100, 48, 22)
    ]
  }
];

export default GESTURE_TEMPLATES;
