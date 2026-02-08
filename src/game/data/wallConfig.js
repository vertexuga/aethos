export function getWallLayout(worldWidth, worldHeight) {
  const cx = worldWidth / 2;
  const cy = worldHeight / 2;
  const t = 20; // wall thickness

  const walls = [];

  // === Inner ring (~200px from center) — tight defense around crystal ===
  // 4 walls forming a square with gaps at cardinal directions
  const innerR = 200;
  const innerGap = 60; // gap size at each opening
  const innerLen = innerR * 1.2; // wall segment length

  // Top-left inner wall (horizontal)
  walls.push({ x: cx - innerR, y: cy - innerR, w: innerLen - innerGap, h: t, hp: 150, maxHp: 150, destructible: true });
  // Top-right inner wall (horizontal)
  walls.push({ x: cx + innerGap / 2, y: cy - innerR, w: innerLen - innerGap, h: t, hp: 150, maxHp: 150, destructible: true });

  // Bottom-left inner wall (horizontal)
  walls.push({ x: cx - innerR, y: cy + innerR - t, w: innerLen - innerGap, h: t, hp: 150, maxHp: 150, destructible: true });
  // Bottom-right inner wall (horizontal)
  walls.push({ x: cx + innerGap / 2, y: cy + innerR - t, w: innerLen - innerGap, h: t, hp: 150, maxHp: 150, destructible: true });

  // Left-top inner wall (vertical)
  walls.push({ x: cx - innerR, y: cy - innerR, w: t, h: innerLen - innerGap, hp: 150, maxHp: 150, destructible: true });
  // Left-bottom inner wall (vertical)
  walls.push({ x: cx - innerR, y: cy + innerGap / 2, w: t, h: innerLen - innerGap, hp: 150, maxHp: 150, destructible: true });

  // Right-top inner wall (vertical)
  walls.push({ x: cx + innerR - t, y: cy - innerR, w: t, h: innerLen - innerGap, hp: 150, maxHp: 150, destructible: true });
  // Right-bottom inner wall (vertical)
  walls.push({ x: cx + innerR - t, y: cy + innerGap / 2, w: t, h: innerLen - innerGap, hp: 150, maxHp: 150, destructible: true });

  // === Outer ring (~450px from center) — wider perimeter ===
  const outerR = 450;
  const outerGap = 80;
  const outerLen = outerR * 0.8;

  // Top outer walls
  walls.push({ x: cx - outerLen / 2, y: cy - outerR, w: outerLen / 2 - outerGap / 2, h: t, hp: 100, maxHp: 100, destructible: true });
  walls.push({ x: cx + outerGap / 2, y: cy - outerR, w: outerLen / 2 - outerGap / 2, h: t, hp: 100, maxHp: 100, destructible: true });

  // Bottom outer walls
  walls.push({ x: cx - outerLen / 2, y: cy + outerR, w: outerLen / 2 - outerGap / 2, h: t, hp: 100, maxHp: 100, destructible: true });
  walls.push({ x: cx + outerGap / 2, y: cy + outerR, w: outerLen / 2 - outerGap / 2, h: t, hp: 100, maxHp: 100, destructible: true });

  // Left outer walls
  walls.push({ x: cx - outerR, y: cy - outerLen / 2, w: t, h: outerLen / 2 - outerGap / 2, hp: 100, maxHp: 100, destructible: true });
  walls.push({ x: cx - outerR, y: cy + outerGap / 2, w: t, h: outerLen / 2 - outerGap / 2, hp: 100, maxHp: 100, destructible: true });

  // Right outer walls
  walls.push({ x: cx + outerR, y: cy - outerLen / 2, w: t, h: outerLen / 2 - outerGap / 2, hp: 100, maxHp: 100, destructible: true });
  walls.push({ x: cx + outerR, y: cy + outerGap / 2, w: t, h: outerLen / 2 - outerGap / 2, hp: 100, maxHp: 100, destructible: true });

  // === Corner barricades at 45-degree angles (~350px diagonal) ===
  const cornerR = 350;
  const corners = [
    { dx: -1, dy: -1 }, // top-left
    { dx: 1, dy: -1 },  // top-right
    { dx: -1, dy: 1 },  // bottom-left
    { dx: 1, dy: 1 },   // bottom-right
  ];

  for (const c of corners) {
    const bx = cx + c.dx * cornerR * 0.7;
    const by = cy + c.dy * cornerR * 0.7;
    // L-shaped corner barricade
    walls.push({ x: bx, y: by, w: 80, h: t, hp: 80, maxHp: 80, destructible: true });
    walls.push({ x: bx, y: by, w: t, h: 80, hp: 80, maxHp: 80, destructible: true });
  }

  return walls;
}
