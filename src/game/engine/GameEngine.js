import GameLoop from './GameLoop.js';
import { useGameStore } from '../../stores/gameStore.js';
import EntityManager from '../entities/EntityManager.js';
import Entity from '../entities/Entity.js';
import InputSystem from '../systems/InputSystem.js';
import RenderPipeline from '../systems/RenderPipeline.js';
import GestureRecognizer from '../systems/GestureRecognizer.js';
import GestureUI from '../systems/GestureUI.js';
import TrajectoryExtractor from '../systems/TrajectoryExtractor.js';
import KeyboardFallback from '../systems/KeyboardFallback.js';
import SpellCaster from '../systems/SpellCaster.js';
import Player from '../entities/player/Player.js';
import SlimeEnemy from '../entities/enemies/SlimeEnemy.js';
import SpellThiefEnemy from '../entities/enemies/SpellThiefEnemy.js';
import GravityWellEnemy from '../entities/enemies/GravityWellEnemy.js';
import PhaseWraithEnemy from '../entities/enemies/PhaseWraithEnemy.js';
import RiftCallerEnemy from '../entities/enemies/RiftCallerEnemy.js';
import CurseHexerEnemy from '../entities/enemies/CurseHexerEnemy.js';
import EnemyPool from '../systems/EnemyPool.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import WaveSpawner from '../systems/WaveSpawner.js';
import DeathParticlePool from '../systems/DeathParticlePool.js';
import MaterialDropPool from '../systems/MaterialDropPool.js';
import CraftedSpellCaster from '../systems/CraftedSpellCaster.js';
import Camera from '../systems/Camera.js';
import WallSystem from '../systems/WallSystem.js';
import StructurePool from '../systems/StructurePool.js';
import { ENEMY_CONFIG } from '../data/enemyConfig.js';
import { ENEMY_DROP_MAP, DROP_AMOUNTS } from '../data/materialConfig.js';
import { getStructurePlacements } from '../data/structureConfig.js';

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.worldWidth = 0;
    this.worldHeight = 0;
    this.camera = null;
    this.gameLoop = null;
    this.systems = [];

    // Core systems
    this.entityManager = null;
    this.inputSystem = null;
    this.renderPipeline = null;
    this.gestureRecognizer = null;
    this.gestureUI = null;
    this.keyboardFallback = null;
    this.spellCaster = null;

    // Combat systems
    this.player = null;
    this.enemyPools = {};   // { slime, spellThief, gravityWell, phaseWraith, riftCaller, curseHexer }
    this.collisionSystem = null;
    this.waveSpawner = null;
    this.deathParticlePool = null;

    // Material & crafting systems
    this.materialDropPool = null;
    this.craftedSpellCaster = null;

    // Wall & structure systems
    this.wallSystem = null;
    this.structurePool = null;

    // Slime merge tracking (group-based)
    this.slimeMergeGroups = []; // { id, slimes, survivor, center, state, timer }

    // Gesture state
    this.lastGestureResult = null;

    // WASD keyboard state
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false
    };

    // Bind methods
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
    this.handleGestureComplete = this.handleGestureComplete.bind(this);
    this.handleKeyboardSpell = this.handleKeyboardSpell.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  init() {
    // Set canvas size
    this.resize();

    // World is 4x the viewport
    this.worldWidth = this.width * 4;
    this.worldHeight = this.height * 4;

    // Create camera
    this.camera = new Camera(this.width, this.height, this.worldWidth, this.worldHeight);

    // Create core systems
    this.entityManager = new EntityManager();
    this.inputSystem = new InputSystem(this.canvas);
    this.inputSystem.setCamera(this.camera);
    this.renderPipeline = new RenderPipeline(this.ctx, this.width, this.height);
    this.gestureRecognizer = new GestureRecognizer();
    this.gestureUI = new GestureUI();
    this.keyboardFallback = new KeyboardFallback();
    this.spellCaster = new SpellCaster(this.entityManager);

    // Create player at world center
    this.player = new Player({ x: this.worldWidth / 2, y: this.worldHeight / 2 });
    this.player.setCanvasSize(this.width, this.height);
    this.player.setWorldSize(this.worldWidth, this.worldHeight);
    this.player.setCamera(this.camera);

    // Create wall system
    this.wallSystem = new WallSystem(this.worldWidth, this.worldHeight);

    // Create structure pool and spawn initial structures
    this.structurePool = new StructurePool(10);
    const placements = getStructurePlacements(this.worldWidth, this.worldHeight);
    for (const p of placements) {
      this.structurePool.spawn(p);
    }
    this.player.setStructurePool(this.structurePool);

    // Create enemy pools for all types
    this.enemyPools = {
      slime: new EnemyPool(SlimeEnemy, 30, this.player),
      spellThief: new EnemyPool(SpellThiefEnemy, 10, this.player),
      gravityWell: new EnemyPool(GravityWellEnemy, 8, this.player),
      phaseWraith: new EnemyPool(PhaseWraithEnemy, 10, this.player),
      riftCaller: new EnemyPool(RiftCallerEnemy, 8, this.player),
      curseHexer: new EnemyPool(CurseHexerEnemy, 8, this.player),
    };

    // Wire wall system to enemies for wall-aware steering
    for (const key in this.enemyPools) {
      this.enemyPools[key].setWallSystem(this.wallSystem);
    }

    // Wire special enemy references
    // Spell Thieves need access to spell caster
    for (const enemy of this.enemyPools.spellThief.pool) {
      enemy.spellCaster = this.spellCaster;
      enemy.entityManager = this.entityManager;
    }
    // Rift Callers need access to slime pool for summoning minions
    for (const enemy of this.enemyPools.riftCaller.pool) {
      enemy.minionPool = this.enemyPools.slime;
    }

    // Create collision system (pass all pools)
    this.collisionSystem = new CollisionSystem(this.player, this.enemyPools, this.spellCaster);

    // Create death particle pool
    this.deathParticlePool = new DeathParticlePool(this.entityManager, 120);

    // Create material drop pool
    this.materialDropPool = new MaterialDropPool(this.player, (materialType) => {
      useGameStore.getState().addMaterial(materialType, 1);
      // Small mana bonus on pickup
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + 2);
    }, 50);

    // Create crafted spell caster
    this.craftedSpellCaster = new CraftedSpellCaster(this.player, this.enemyPools);

    // Wire BlinkStep's reference to CraftedSpellCaster for tier 3 cooldown reset
    this.craftedSpellCaster.spellInstances.blinkStep.craftedSpellCaster = this.craftedSpellCaster;

    // Create wave spawner (pass all pools)
    this.waveSpawner = new WaveSpawner(this.enemyPools, this.entityManager, this.width, this.height);
    this.waveSpawner.setCamera(this.camera);
    this.waveSpawner.setWorldSize(this.worldWidth, this.worldHeight);

    // Set canvas size and player reference for spell caster
    this.spellCaster.setCanvasSize(this.worldWidth, this.worldHeight);
    this.spellCaster.setPlayer(this.player);

    // Initialize input system
    this.inputSystem.init();

    // Initialize keyboard fallback
    this.keyboardFallback.init();
    this.keyboardFallback.onSpellCast = this.handleKeyboardSpell;

    // Wire gesture recognition callbacks
    this.inputSystem.onStopDrawing = this.handleGestureComplete;

    // Real-time recognition on shape closure (trail turns spell color while still drawing)
    this.inputSystem.onShapeClosed = (shapePoints) => {
      const result = this.gestureRecognizer.recognize(shapePoints);
      if (result) {
        this.inputSystem.setSpellRecognition(result.name);
      }
    };

    // Create game loop
    this.gameLoop = new GameLoop(this.update, this.render);

    // Add resize listener
    window.addEventListener('resize', this.resize);

    // Add WASD keyboard listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Start first wave
    this.waveSpawner.startNextWave();

    // Start the loop
    this.gameLoop.start();
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
      this.keys[key] = true;
      e.preventDefault();
    }

    // Crafted spell keys (1 and 2)
    if (key === '1' || key === '2') {
      const slot = parseInt(key) - 1;
      if (this.craftedSpellCaster) {
        this.craftedSpellCaster.castSlot(slot);
        this.player.triggerCastGlow();
      }
      e.preventDefault();
    }

    // E key for structure build / repair
    if (key === 'e' && this.structurePool && this.player) {
      // Priority 1: build unbuilt structures
      const unbuilt = this.structurePool.getNearestUnbuiltInRange(this.player.x, this.player.y, 60);
      if (unbuilt) {
        const cost = unbuilt.config.buildCost;
        const store = useGameStore.getState();
        // Check if player can afford
        let canAfford = true;
        for (const [mat, count] of Object.entries(cost)) {
          if ((store.inventory[mat] || 0) < count) { canAfford = false; break; }
        }
        if (canAfford) {
          store.removeMaterials(cost);
          unbuilt.build();
        }
        return;
      }
      // Priority 2: repair damaged built structures
      const damaged = this.structurePool.getNearestDamagedInRange(this.player.x, this.player.y, 60);
      if (damaged) {
        damaged.repair();
      }
    }
  }

  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
      this.keys[key] = false;
      e.preventDefault();
    }
  }

  /**
   * Notify Spell Thieves when player casts a spell so they can copy it.
   */
  notifySpellThieves(spellName) {
    const activeThieves = this.enemyPools.spellThief.getActive();
    for (const thief of activeThieves) {
      if (thief.active) {
        thief.copySpell(spellName);
      }
    }
  }

  handleGestureComplete(points) {
    // Split drawn points into shape (for recognition) and tail arc (for trajectory)
    const { shapePoints, trajectory } = TrajectoryExtractor.splitAndExtract(points);

    // Recognize the gesture from shape points only (tail excluded for closing shapes)
    const result = this.gestureRecognizer.recognize(shapePoints);

    if (result) {
      result.trajectory = trajectory;

      // Store result locally and in Zustand
      this.lastGestureResult = result;
      useGameStore.getState().setLastGesture(result);

      // Show visual feedback
      this.gestureUI.showResult(result);

      // Color trail with spell color (for non-closing shapes that didn't get early recognition)
      this.inputSystem.setSpellRecognition(result.name);

      // Cast the spell (same frame as recognition)
      this.spellCaster.castSpell(result);

      // Trigger cast glow on player
      this.player.triggerCastGlow();

      // Notify Spell Thieves of the cast
      this.notifySpellThieves(result.name);

      // Debug logging
      const arcInfo = trajectory?.hasArc ? `Arc: ${trajectory.waypoints.length} waypoints` : 'Straight';
      console.log(`Gesture: ${result.name} (${(result.score * 100).toFixed(0)}%) - Damage: ${(result.damageModifier * 100).toFixed(0)}%`, trajectory ? `- ${arcInfo} ${(trajectory.angle * 180 / Math.PI).toFixed(0)}°` : '- No trajectory');
    } else {
      // No recognition or below threshold
      this.lastGestureResult = null;
      useGameStore.getState().clearGesture();
    }
  }

  handleKeyboardSpell(result) {
    // Store result locally and in Zustand
    this.lastGestureResult = result;
    useGameStore.getState().setLastGesture(result);

    // Show UI feedback (same as drawn gestures)
    this.gestureUI.showResult(result);

    // Cast the spell
    this.spellCaster.castSpell(result);

    // Trigger cast glow on player
    this.player.triggerCastGlow();

    // Notify Spell Thieves of the cast
    this.notifySpellThieves(result.name);

    // Debug logging
    console.log(`Keyboard spell: ${result.name}`);
  }

  updateSlimeMerge(dt) {
    const activeSlimes = this.enemyPools.slime.getActive();

    // Update existing merge groups
    for (let g = this.slimeMergeGroups.length - 1; g >= 0; g--) {
      const group = this.slimeMergeGroups[g];

      // Remove dead slimes from group
      group.slimes = group.slimes.filter(s => s.active);
      if (group.slimes.length < 2) {
        // Not enough slimes left — cancel merge
        for (const s of group.slimes) {
          s.mergeState = 'none';
          s.mergeGroupId = null;
          s.mergePartners = [];
        }
        this.slimeMergeGroups.splice(g, 1);
        continue;
      }

      group.timer += dt;

      switch (group.state) {
        case 'gathering': {
          // Check if all slimes arrived near center
          let allArrived = true;
          for (const s of group.slimes) {
            const dx = s.x - group.center.x;
            const dy = s.y - group.center.y;
            if (dx * dx + dy * dy > 20 * 20) {
              allArrived = false;
              break;
            }
          }
          // Transition to orbiting when all arrive or timeout
          if (allArrived || group.timer > 2.5) {
            group.state = 'orbiting';
            group.timer = 0;
            const orbitRadius = 25;
            for (let i = 0; i < group.slimes.length; i++) {
              const s = group.slimes[i];
              s.mergeState = 'orbiting';
              s.mergeOrbitRadius = orbitRadius;
              s.mergeOrbitPhase = (i / group.slimes.length) * Math.PI * 2;
            }
          }
          break;
        }
        case 'orbiting': {
          if (group.timer > 1.8) {
            group.state = 'absorbing';
            group.timer = 0;
            for (const s of group.slimes) {
              s.mergeState = 'absorbing';
              s.mergeAbsorbTimer = 0;
            }
          }
          break;
        }
        case 'absorbing': {
          if (group.timer > 0.6) {
            // Execute merge: survivor absorbs all others
            const survivor = group.survivor;
            const absorbed = group.slimes.filter(s => s !== survivor && s.active);
            for (const s of absorbed) {
              s.die();
            }
            // Apply merge boosts per absorbed slime (capped at mergeSize 3)
            for (const s of absorbed) {
              if (survivor.mergeSize < 3) {
                survivor.applyMerge();
              }
            }
            survivor.mergeState = 'none';
            survivor.mergeGroupId = null;
            survivor.mergePartners = [];
            this.slimeMergeGroups.splice(g, 1);
          }
          break;
        }
      }
    }

    // Detect new clusters of 3+ non-merging slimes
    const eligible = activeSlimes.filter(s =>
      s.active && s.mergeState === 'none' && s.mergeSize < 3 &&
      s.dashState !== 'dashing' && s.dashState !== 'charging'
    );

    const clusterRadius = 80;
    const visited = new Set();

    for (let i = 0; i < eligible.length; i++) {
      const start = eligible[i];
      if (visited.has(start.id)) continue;

      // BFS to find connected cluster
      const cluster = [];
      const queue = [start];
      visited.add(start.id);

      while (queue.length > 0) {
        const current = queue.shift();
        cluster.push(current);
        for (const other of eligible) {
          if (visited.has(other.id)) continue;
          const dx = other.x - current.x;
          const dy = other.y - current.y;
          if (dx * dx + dy * dy < clusterRadius * clusterRadius) {
            visited.add(other.id);
            queue.push(other);
          }
        }
      }

      if (cluster.length >= 3) {
        // Form merge group (cap at 5 slimes)
        const groupSlimes = cluster.slice(0, 5);

        // Calculate centroid
        let cx = 0, cy = 0;
        for (const s of groupSlimes) { cx += s.x; cy += s.y; }
        cx /= groupSlimes.length;
        cy /= groupSlimes.length;

        // Pick survivor (highest HP)
        let survivor = groupSlimes[0];
        for (const s of groupSlimes) {
          if (s.hp > survivor.hp) survivor = s;
        }

        const groupId = `merge_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

        const group = {
          id: groupId,
          slimes: groupSlimes,
          survivor,
          center: { x: cx, y: cy },
          state: 'gathering',
          timer: 0,
        };

        this.slimeMergeGroups.push(group);

        // Notify all slimes to start merging
        for (let j = 0; j < groupSlimes.length; j++) {
          const s = groupSlimes[j];
          s.startMerge(
            group.center,
            groupId,
            groupSlimes.filter(o => o !== s),
            s === survivor,
            (j / groupSlimes.length) * Math.PI * 2
          );
        }
      }
    }
  }

  update(dt) {
    // Update WASD movement direction for player
    this.player.moveDirection.x = 0;
    this.player.moveDirection.y = 0;

    if (this.keys.w) this.player.moveDirection.y -= 1;
    if (this.keys.s) this.player.moveDirection.y += 1;
    if (this.keys.a) this.player.moveDirection.x -= 1;
    if (this.keys.d) this.player.moveDirection.x += 1;

    // Update input system
    this.inputSystem.update(dt);

    // Update gesture UI
    this.gestureUI.update(dt);

    // Update spell caster pools
    this.spellCaster.update(dt);

    // Update player
    this.player.update(dt);

    // Resolve player-wall collisions
    if (this.wallSystem) {
      this.wallSystem.resolveCircleWallCollision(this.player);
    }

    // Update camera to follow player
    this.camera.follow(this.player, dt);
    this.camera.updateShake(dt);

    // Sync mana to store
    useGameStore.getState().setMana(this.player.mana);

    // Update all enemy pools
    for (const key in this.enemyPools) {
      this.enemyPools[key].update(dt);
    }

    // Resolve enemy-wall collisions
    if (this.wallSystem) {
      for (const key in this.enemyPools) {
        for (const enemy of this.enemyPools[key].getActive()) {
          if (enemy.active) {
            this.wallSystem.resolveCircleWallCollision(enemy);
          }
        }
      }
    }

    // Update wave spawner
    this.waveSpawner.update(dt);

    // Update collision system
    this.collisionSystem.update(dt);

    // Update slime merge mechanic
    this.updateSlimeMerge(dt);

    // Update wall system animation
    if (this.wallSystem) {
      this.wallSystem.update(dt);
    }

    // Update structures
    if (this.structurePool) {
      this.structurePool.update(dt, this.enemyPools);

      // Enemy-structure contact damage (DPS-based)
      for (const structure of this.structurePool.getActive()) {
        for (const key in this.enemyPools) {
          for (const enemy of this.enemyPools[key].getActive()) {
            if (!enemy.active || enemy.contactDamage <= 0) continue;
            if (enemy.isPhased) continue;
            const sdx = enemy.x - structure.x;
            const sdy = enemy.y - structure.y;
            const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
            if (sDist < enemy.size + structure.size) {
              structure.takeDamage(enemy.contactDamage * dt);
            }
          }
        }
      }
    }

    // Check for dead enemies across all pools and spawn death particles + material drops
    for (const key in this.enemyPools) {
      const activeEnemies = this.enemyPools[key].getActive();
      for (const enemy of activeEnemies) {
        if (enemy.justDied) {
          this.deathParticlePool.spawnBurst(enemy.x, enemy.y, enemy.color);

          // Spawn material drop
          const materialType = ENEMY_DROP_MAP[key];
          if (materialType) {
            const dropRange = DROP_AMOUNTS[key] || { min: 1, max: 1 };
            const dropCount = dropRange.min + Math.floor(Math.random() * (dropRange.max - dropRange.min + 1));
            for (let i = 0; i < dropCount; i++) {
              const offsetX = (Math.random() - 0.5) * 20;
              const offsetY = (Math.random() - 0.5) * 20;
              this.materialDropPool.spawn({
                x: enemy.x + offsetX,
                y: enemy.y + offsetY,
                materialType,
              });
            }
          }

          enemy.justDied = false;
        }
      }
    }

    // Update material drop pool
    this.materialDropPool.update(dt);

    // Update crafted spell caster
    this.craftedSpellCaster.update(dt);

    // Update death particle pool
    this.deathParticlePool.update(dt);

    // Update entity manager
    this.entityManager.update(dt);

    // Apply boundary behavior for entities (world bounds)
    const entities = this.entityManager.getAll();
    for (const entity of entities) {
      // Projectiles get destroyed when out of world bounds or hitting walls
      if (entity.type.startsWith('projectile-')) {
        if (entity.x < -entity.size || entity.x > this.worldWidth + entity.size ||
            entity.y < -entity.size || entity.y > this.worldHeight + entity.size) {
          entity.destroy();
        } else if (this.wallSystem && this.wallSystem.checkProjectileWallCollision(entity)) {
          entity.destroy();
        }
      } else {
        // Non-projectiles clamped to world bounds
        entity.x = Math.max(entity.size, Math.min(this.worldWidth - entity.size, entity.x));
        entity.y = Math.max(entity.size, Math.min(this.worldHeight - entity.size, entity.y));
      }
    }

    // Update all systems
    this.systems.forEach(system => {
      if (system.update) {
        system.update(dt);
      }
    });

    // Update FPS in Zustand store
    const fps = this.gameLoop.getFPS();
    useGameStore.getState().setFPS(fps);
  }

  render(interpolation) {
    // Clear canvas (transparent so video background shows through)
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Semi-transparent dark overlay to keep game readable over video
    this.ctx.fillStyle = 'rgba(10, 10, 18, 0.75)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render pipeline (entities, player, enemies, trail, UI, HUD, material drops, crafted spells, walls, structures)
    this.renderPipeline.render(
      this.ctx,
      this.entityManager,
      this.inputSystem,
      interpolation,
      this.gestureUI,
      this.player,
      this.enemyPools,
      this.waveSpawner,
      this.materialDropPool,
      this.craftedSpellCaster,
      this.camera,
      this.wallSystem,
      this.structurePool
    );

    // Render all systems
    this.systems.forEach(system => {
      if (system.render) {
        system.render(this.ctx, interpolation);
      }
    });

  }

  addSystem(system) {
    this.systems.push(system);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Update camera viewport size
    if (this.camera) {
      this.camera.resize(this.width, this.height);
    }

    // Update spell caster canvas size (use world bounds)
    if (this.spellCaster) {
      this.spellCaster.setCanvasSize(this.worldWidth || this.width, this.worldHeight || this.height);
    }

    // Update player canvas size
    if (this.player) {
      this.player.setCanvasSize(this.width, this.height);
    }

    // Update wave spawner canvas size
    if (this.waveSpawner) {
      this.waveSpawner.setCanvasSize(this.width, this.height);
    }
  }

  destroy() {
    // Clean up input system
    if (this.inputSystem) {
      this.inputSystem.destroy();
    }

    // Clean up keyboard fallback
    if (this.keyboardFallback) {
      this.keyboardFallback.destroy();
    }

    // Stop game loop
    if (this.gameLoop) {
      this.gameLoop.stop();
    }

    // Remove resize listener
    window.removeEventListener('resize', this.resize);

    // Remove WASD listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    // Clear references
    this.canvas = null;
    this.ctx = null;
    this.gameLoop = null;
    this.systems = [];
    this.entityManager = null;
    this.inputSystem = null;
    this.renderPipeline = null;
    this.gestureRecognizer = null;
    this.gestureUI = null;
    this.keyboardFallback = null;
    this.spellCaster = null;
    this.player = null;
    this.enemyPools = {};
    this.collisionSystem = null;
    this.waveSpawner = null;
    this.deathParticlePool = null;
    this.materialDropPool = null;
    this.craftedSpellCaster = null;
    this.camera = null;
    this.wallSystem = null;
    this.structurePool = null;
    this.slimeMergeGroups = null;
    this.lastGestureResult = null;
  }
}

export default GameEngine;
