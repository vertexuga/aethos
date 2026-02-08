import { DUNGEON_TIERS } from '../data/dungeonConfig.js';

/**
 * Seeded PRNG (Mulberry32)
 */
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class DungeonGenerator {
  /**
   * Generate a dungeon layout.
   * @param {number} seed - Random seed for deterministic generation
   * @param {number} tier - Dungeon difficulty tier (1-3)
   * @returns {{ rooms, corridors, walls, spawnRoom, bossRoom, worldWidth, worldHeight }}
   */
  static generate(seed, tier = 1) {
    const rand = mulberry32(seed);
    const config = DUNGEON_TIERS[tier] || DUNGEON_TIERS[1];

    // 1. Generate rooms via rejection sampling
    const roomCount = config.roomCount.min + Math.floor(rand() * (config.roomCount.max - config.roomCount.min + 1));
    const rooms = DungeonGenerator.placeRooms(rand, roomCount, config);

    // Calculate world bounds from rooms
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const room of rooms) {
      minX = Math.min(minX, room.x);
      minY = Math.min(minY, room.y);
      maxX = Math.max(maxX, room.x + room.w);
      maxY = Math.max(maxY, room.y + room.h);
    }
    const padding = 200;
    const worldWidth = maxX - minX + padding * 2;
    const worldHeight = maxY - minY + padding * 2;

    // Offset rooms so world starts at 0,0
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;
    for (const room of rooms) {
      room.x += offsetX;
      room.y += offsetY;
      room.cx = room.x + room.w / 2;
      room.cy = room.y + room.h / 2;
    }

    // 2. Connect rooms with MST (Prim's) + extra edges for loops
    const corridors = DungeonGenerator.connectRooms(rand, rooms);

    // 3. Convert to walls using grid-based approach + greedy mesh
    const cellSize = 20;
    const gridW = Math.ceil(worldWidth / cellSize);
    const gridH = Math.ceil(worldHeight / cellSize);
    const grid = DungeonGenerator.buildGrid(gridW, gridH, rooms, corridors, cellSize, config.corridorWidth);
    const walls = DungeonGenerator.greedyMesh(grid, gridW, gridH, cellSize);

    // 4. Assign room roles
    const spawnRoom = rooms[0]; // First room placed
    spawnRoom.role = 'spawn';

    // Boss room = farthest from spawn
    let bossRoom = rooms[1];
    let maxDist = 0;
    for (let i = 1; i < rooms.length; i++) {
      const dx = rooms[i].cx - spawnRoom.cx;
      const dy = rooms[i].cy - spawnRoom.cy;
      const dist = dx * dx + dy * dy;
      if (dist > maxDist) {
        maxDist = dist;
        bossRoom = rooms[i];
      }
    }
    bossRoom.role = 'boss';

    // Assign roles to remaining rooms
    for (const room of rooms) {
      if (room.role) continue;
      const r = rand();
      if (r < 0.3) room.role = 'loot';
      else room.role = 'enemy';
    }

    // Generate enemy/loot placement info per room
    for (const room of rooms) {
      room.enemies = [];
      room.lootPositions = [];

      if (room.role === 'enemy' || room.role === 'boss') {
        const count = config.enemiesPerRoom.min + Math.floor(rand() * (config.enemiesPerRoom.max - config.enemiesPerRoom.min + 1));
        const actualCount = room.role === 'boss' ? count + 2 : count;
        for (let i = 0; i < actualCount; i++) {
          room.enemies.push({
            x: room.x + 50 + rand() * (room.w - 100),
            y: room.y + 50 + rand() * (room.h - 100),
            type: DungeonGenerator.randomEnemyType(rand),
          });
        }
      }

      if (room.role === 'loot' || room.role === 'boss') {
        const chestCount = room.role === 'boss' ? 2 : 1;
        for (let i = 0; i < chestCount; i++) {
          room.lootPositions.push({
            x: room.cx + (rand() - 0.5) * (room.w * 0.4),
            y: room.cy + (rand() - 0.5) * (room.h * 0.4),
          });
        }
      }
    }

    // Validate enemy & loot positions — ensure they're in open cells, not inside walls
    for (const room of rooms) {
      for (const enemyDef of room.enemies) {
        const gx = Math.floor(enemyDef.x / cellSize);
        const gy = Math.floor(enemyDef.y / cellSize);
        if (gx < 0 || gx >= gridW || gy < 0 || gy >= gridH || grid[gy * gridW + gx] === 1) {
          // Snap to room center (guaranteed open)
          enemyDef.x = room.cx;
          enemyDef.y = room.cy;
        }
      }
      for (const lootDef of room.lootPositions) {
        const gx = Math.floor(lootDef.x / cellSize);
        const gy = Math.floor(lootDef.y / cellSize);
        if (gx < 0 || gx >= gridW || gy < 0 || gy >= gridH || grid[gy * gridW + gx] === 1) {
          lootDef.x = room.cx;
          lootDef.y = room.cy;
        }
      }
    }

    return {
      rooms,
      corridors,
      walls,
      spawnRoom,
      bossRoom,
      worldWidth,
      worldHeight,
      tier,
      seed,
    };
  }

  static randomEnemyType(rand) {
    const types = ['slime', 'spellThief', 'gravityWell', 'phaseWraith', 'curseHexer'];
    return types[Math.floor(rand() * types.length)];
  }

  static placeRooms(rand, count, config) {
    const rooms = [];
    const maxAttempts = 1000;
    let attempts = 0;

    while (rooms.length < count && attempts < maxAttempts) {
      attempts++;

      const w = config.roomSize.min + Math.floor(rand() * (config.roomSize.max - config.roomSize.min));
      const h = config.roomSize.min + Math.floor(rand() * (config.roomSize.max - config.roomSize.min));

      // Random position — tight spread so corridors stay short
      const avgRoom = (config.roomSize.min + config.roomSize.max) / 2;
      const spreadX = count * avgRoom * 0.55;
      const spreadY = count * avgRoom * 0.55;
      const x = Math.floor(rand() * spreadX);
      const y = Math.floor(rand() * spreadY);

      const room = { x, y, w, h, cx: x + w / 2, cy: y + h / 2, role: null, id: rooms.length };

      // Check overlap with existing rooms (padding = corridor gap)
      const padDist = config.corridorWidth + 20;
      let overlaps = false;
      for (const existing of rooms) {
        if (
          room.x < existing.x + existing.w + padDist &&
          room.x + room.w + padDist > existing.x &&
          room.y < existing.y + existing.h + padDist &&
          room.y + room.h + padDist > existing.y
        ) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        rooms.push(room);
      }
    }

    return rooms;
  }

  static connectRooms(rand, rooms) {
    if (rooms.length < 2) return [];

    const corridors = [];

    // Prim's MST on room centers
    const connected = new Set([0]);
    const edges = [];

    // Build all edges with distances
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const dx = rooms[i].cx - rooms[j].cx;
        const dy = rooms[i].cy - rooms[j].cy;
        edges.push({ i, j, dist: Math.sqrt(dx * dx + dy * dy) });
      }
    }

    edges.sort((a, b) => a.dist - b.dist);

    // Prim's MST
    while (connected.size < rooms.length) {
      for (const edge of edges) {
        const iConnected = connected.has(edge.i);
        const jConnected = connected.has(edge.j);
        if (iConnected !== jConnected) {
          connected.add(edge.i);
          connected.add(edge.j);
          corridors.push({
            from: rooms[edge.i],
            to: rooms[edge.j],
          });
          break;
        }
      }
    }

    // Add 1-2 extra random edges for loops
    const extraEdges = 1 + Math.floor(rand() * 2);
    const unusedEdges = edges.filter(
      e => !corridors.some(c =>
        (c.from === rooms[e.i] && c.to === rooms[e.j]) ||
        (c.from === rooms[e.j] && c.to === rooms[e.i])
      )
    );

    for (let i = 0; i < Math.min(extraEdges, unusedEdges.length); i++) {
      const idx = Math.floor(rand() * unusedEdges.length);
      const edge = unusedEdges.splice(idx, 1)[0];
      corridors.push({
        from: rooms[edge.i],
        to: rooms[edge.j],
      });
    }

    return corridors;
  }

  static buildGrid(gridW, gridH, rooms, corridors, cellSize, corridorWidth) {
    // 1 = wall, 0 = open
    const grid = new Uint8Array(gridW * gridH);
    grid.fill(1); // Start all wall

    // Carve rooms
    for (const room of rooms) {
      const x1 = Math.floor(room.x / cellSize);
      const y1 = Math.floor(room.y / cellSize);
      const x2 = Math.ceil((room.x + room.w) / cellSize);
      const y2 = Math.ceil((room.y + room.h) / cellSize);

      for (let y = y1; y < y2 && y < gridH; y++) {
        for (let x = x1; x < x2 && x < gridW; x++) {
          if (x >= 0 && y >= 0) {
            grid[y * gridW + x] = 0;
          }
        }
      }
    }

    // Carve L-shaped corridors
    const halfCorridor = Math.ceil(corridorWidth / 2 / cellSize);
    for (const corridor of corridors) {
      const fromCx = Math.floor(corridor.from.cx / cellSize);
      const fromCy = Math.floor(corridor.from.cy / cellSize);
      const toCx = Math.floor(corridor.to.cx / cellSize);
      const toCy = Math.floor(corridor.to.cy / cellSize);

      // Horizontal segment (from.cx → to.cx at from.cy)
      const minX = Math.min(fromCx, toCx);
      const maxX = Math.max(fromCx, toCx);
      for (let x = minX; x <= maxX; x++) {
        for (let dy = -halfCorridor; dy <= halfCorridor; dy++) {
          const y = fromCy + dy;
          if (x >= 0 && x < gridW && y >= 0 && y < gridH) {
            grid[y * gridW + x] = 0;
          }
        }
      }

      // Vertical segment (from.cy → to.cy at to.cx)
      const minY = Math.min(fromCy, toCy);
      const maxY = Math.max(fromCy, toCy);
      for (let y = minY; y <= maxY; y++) {
        for (let dx = -halfCorridor; dx <= halfCorridor; dx++) {
          const x = toCx + dx;
          if (x >= 0 && x < gridW && y >= 0 && y < gridH) {
            grid[y * gridW + x] = 0;
          }
        }
      }
    }

    return grid;
  }

  static greedyMesh(grid, gridW, gridH, cellSize) {
    const walls = [];
    const visited = new Uint8Array(gridW * gridH);

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        if (grid[y * gridW + x] !== 1 || visited[y * gridW + x]) continue;

        // Expand horizontally
        let endX = x;
        while (endX < gridW && grid[y * gridW + endX] === 1 && !visited[y * gridW + endX]) {
          endX++;
        }
        const rectW = endX - x;

        // Expand vertically
        let endY = y + 1;
        outer:
        while (endY < gridH) {
          for (let cx = x; cx < x + rectW; cx++) {
            if (grid[endY * gridW + cx] !== 1 || visited[endY * gridW + cx]) {
              break outer;
            }
          }
          endY++;
        }
        const rectH = endY - y;

        // Mark visited
        for (let ry = y; ry < y + rectH; ry++) {
          for (let rx = x; rx < x + rectW; rx++) {
            visited[ry * gridW + rx] = 1;
          }
        }

        walls.push({
          x: x * cellSize,
          y: y * cellSize,
          w: rectW * cellSize,
          h: rectH * cellSize,
          hp: 999,
          maxHp: 999,
          destructible: false,
        });
      }
    }

    return walls;
  }
}

export default DungeonGenerator;
