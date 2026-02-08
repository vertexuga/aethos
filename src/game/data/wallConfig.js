// Seeded random for deterministic wall placement
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function getWallLayout(worldWidth, worldHeight) {
  const cx = worldWidth / 2;
  const cy = worldHeight / 2;
  const t = 20; // wall thickness

  const walls = [
    // Central cross barriers — arms pushed far from center (120px gap each side)
    { x: cx - 300, y: cy - t / 2, w: 180, h: t },
    { x: cx + 120, y: cy - t / 2, w: 180, h: t },
    { x: cx - t / 2, y: cy - 300, w: t, h: 180 },
    { x: cx - t / 2, y: cy + 120, w: t, h: 180 },

    // Corner barriers (L-shaped fragments)
    { x: worldWidth * 0.2,  y: worldHeight * 0.2,  w: 80, h: t },
    { x: worldWidth * 0.2,  y: worldHeight * 0.2,  w: t, h: 80 },
    { x: worldWidth * 0.75, y: worldHeight * 0.2,  w: 80, h: t },
    { x: worldWidth * 0.75 + 60, y: worldHeight * 0.2, w: t, h: 80 },
    { x: worldWidth * 0.2,  y: worldHeight * 0.75, w: 80, h: t },
    { x: worldWidth * 0.2,  y: worldHeight * 0.75 - 60, w: t, h: 80 },
    { x: worldWidth * 0.75, y: worldHeight * 0.75, w: 80, h: t },
    { x: worldWidth * 0.75 + 60, y: worldHeight * 0.75 - 60, w: t, h: 80 },
  ];

  // Generate scattered random walls across the map
  const rand = seededRandom(42);
  const margin = 80; // stay away from world edges
  const centerClearance = 200; // keep center spawn area clear

  for (let i = 0; i < 25; i++) {
    const wx = margin + rand() * (worldWidth - margin * 2);
    const wy = margin + rand() * (worldHeight - margin * 2);

    // Skip if too close to center (player spawn)
    const dcx = wx - cx;
    const dcy = wy - cy;
    if (Math.sqrt(dcx * dcx + dcy * dcy) < centerClearance) continue;

    // Random orientation: horizontal or vertical
    const horizontal = rand() > 0.5;
    const length = 60 + Math.floor(rand() * 80); // 60-140px

    if (horizontal) {
      walls.push({ x: wx, y: wy, w: length, h: t });
    } else {
      walls.push({ x: wx, y: wy, w: t, h: length });
    }
  }

  return walls;
}
