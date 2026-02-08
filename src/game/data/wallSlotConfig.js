// Buildable door positions and costs
// These are positions where the player can construct doors
// Doors block enemies but let the player pass through

export const DOOR_BUILD_COST = { mirrorShard: 2, portalStone: 1 };
export const DOOR_REPAIR_COST = { mirrorShard: 1 };
export const DOOR_HP = 120;

// Keep old names as aliases for backwards compatibility with any other imports
export const WALL_BUILD_COST = DOOR_BUILD_COST;
export const WALL_REPAIR_COST = DOOR_REPAIR_COST;
export const WALL_SLOT_HP = DOOR_HP;

export function getWallSlots(worldWidth, worldHeight) {
  const cx = worldWidth / 2;
  const cy = worldHeight / 2;
  const t = 20;

  // Buildable door slots fill the gaps in the defensive rings
  const slots = [];

  // Inner ring gap fillers (cardinal direction gaps)
  const innerR = 200;
  const innerGap = 60;

  // Top gap
  slots.push({ x: cx - innerGap / 2, y: cy - innerR, w: innerGap, h: t, isDoor: true });
  // Bottom gap
  slots.push({ x: cx - innerGap / 2, y: cy + innerR - t, w: innerGap, h: t, isDoor: true });
  // Left gap
  slots.push({ x: cx - innerR, y: cy - innerGap / 2, w: t, h: innerGap, isDoor: true });
  // Right gap
  slots.push({ x: cx + innerR - t, y: cy - innerGap / 2, w: t, h: innerGap, isDoor: true });

  // Outer ring gap fillers
  const outerR = 450;
  const outerGap = 80;

  // Top gap
  slots.push({ x: cx - outerGap / 2, y: cy - outerR, w: outerGap, h: t, isDoor: true });
  // Bottom gap
  slots.push({ x: cx - outerGap / 2, y: cy + outerR, w: outerGap, h: t, isDoor: true });
  // Left gap
  slots.push({ x: cx - outerR, y: cy - outerGap / 2, w: t, h: outerGap, isDoor: true });
  // Right gap
  slots.push({ x: cx + outerR, y: cy - outerGap / 2, w: t, h: outerGap, isDoor: true });

  // Extra buildable slots between rings (strategic positions)
  const midR = 320;
  // Diagonal positions
  slots.push({ x: cx + midR * 0.7, y: cy - midR * 0.7, w: 60, h: t, isDoor: true });
  slots.push({ x: cx - midR * 0.7 - 60, y: cy - midR * 0.7, w: 60, h: t, isDoor: true });
  slots.push({ x: cx + midR * 0.7, y: cy + midR * 0.7, w: 60, h: t, isDoor: true });
  slots.push({ x: cx - midR * 0.7 - 60, y: cy + midR * 0.7, w: 60, h: t, isDoor: true });

  return slots;
}
