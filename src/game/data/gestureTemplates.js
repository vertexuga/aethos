// Gesture templates for $1 Recognizer
// Each shape has 3 variations with slight jitter to simulate human drawing imprecision

// Helper: Add random jitter to points
function addJitter(points, amount) {
  return points.map(p => ({
    x: p.x + (Math.random() - 0.5) * amount * 2,
    y: p.y + (Math.random() - 0.5) * amount * 2
  }));
}

// Circle template generator
function generateCircle(centerX = 100, centerY = 100, radius = 50, numPoints = 32) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }
  return points;
}

// Triangle template generator
function generateTriangle(centerX = 100, centerY = 100, size = 60) {
  const points = [];
  const height = size * Math.sqrt(3) / 2;

  // Top point
  const topX = centerX;
  const topY = centerY - height / 2;

  // Bottom-left
  const blX = centerX - size / 2;
  const blY = centerY + height / 2;

  // Bottom-right
  const brX = centerX + size / 2;
  const brY = centerY + height / 2;

  // Draw top to bottom-left
  for (let t = 0; t <= 1; t += 0.1) {
    points.push({
      x: topX + (blX - topX) * t,
      y: topY + (blY - topY) * t
    });
  }

  // Draw bottom-left to bottom-right
  for (let t = 0; t <= 1; t += 0.1) {
    points.push({
      x: blX + (brX - blX) * t,
      y: blY + (brY - blY) * t
    });
  }

  // Draw bottom-right to top
  for (let t = 0; t <= 1; t += 0.1) {
    points.push({
      x: brX + (topX - brX) * t,
      y: brY + (topY - brY) * t
    });
  }

  return points;
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
function generateZigzag(startX = 50, startY = 80, length = 100, peaks = 3, amplitude = 30) {
  const points = [];
  const segmentWidth = length / peaks;

  for (let i = 0; i <= peaks; i++) {
    const x = startX + i * segmentWidth;
    const y = i % 2 === 0 ? startY : startY + amplitude;

    // Add intermediate points
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

  return points;
}

// Spiral template generator
function generateSpiral(centerX = 100, centerY = 100, startRadius = 50, turns = 2, numPoints = 40) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const angle = t * Math.PI * 2 * turns;
    const radius = startRadius * (1 - t * 0.8); // Shrinks to 20% of start

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

  // Draw circle
  for (let i = 0; i <= 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }

  // Move to center for dot
  points.push({ x: centerX, y: centerY });

  // Draw small dot in center
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
  const numPoints = 10; // 5 outer + 5 inner

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2; // Start at top
    const radius = i % 2 === 0 ? outerRadius : innerRadius;

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    // Add intermediate points
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
const GESTURE_TEMPLATES = [
  {
    name: 'circle',
    variations: [
      generateCircle(100, 100, 50),
      addJitter(generateCircle(100, 100, 50), 3),
      addJitter(generateCircle(100, 100, 50), 5)
    ]
  },
  {
    name: 'triangle',
    variations: [
      generateTriangle(100, 100, 60),
      addJitter(generateTriangle(100, 100, 60), 3),
      addJitter(generateTriangle(100, 100, 60), 4)
    ]
  },
  {
    name: 'line',
    variations: [
      generateLine(50, 100, 150, 100), // Horizontal
      addJitter(generateLine(50, 100, 150, 100), 2), // Horizontal with jitter
      generateLine(50, 95, 150, 105) // Nearly horizontal with slight slope
    ]
  },
  {
    name: 'zigzag',
    variations: [
      generateZigzag(50, 60, 120, 4, 60), // 4 peaks, 60px amplitude — very distinct from line
      addJitter(generateZigzag(50, 60, 120, 4, 55), 3),
      generateZigzag(50, 65, 115, 3, 65) // 3 peaks, 65px amplitude
    ]
  },
  {
    name: 'spiral',
    variations: [
      generateSpiral(100, 100, 50, 2),
      addJitter(generateSpiral(100, 100, 50, 2.2), 2),
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
      generateStar(100, 100, 48, 22)
    ]
  }
];

export default GESTURE_TEMPLATES;
