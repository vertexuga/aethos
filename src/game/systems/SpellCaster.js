import ProjectilePool from './ProjectilePool.js';
import SeekingMissileEntity from '../entities/projectiles/SeekingMissileEntity.js';
import WaterBombEntity from '../entities/projectiles/WaterBombEntity.js';
import WaterPuddle from '../entities/projectiles/WaterPuddle.js';
import EarthWaveEntity from '../entities/projectiles/EarthWaveEntity.js';
import BasicAttackEntity from '../entities/projectiles/BasicAttackEntity.js';
import LightningStrikeEffect from '../entities/projectiles/LightningStrikeEffect.js';
import { SPELL_CONFIG } from '../data/spellConfig.js';

class SpellCaster {
  constructor(entityManager) {
    this.entityManager = entityManager;

    // Projectile pools for each spell type
    this.seekingMissilePool = new ProjectilePool(SeekingMissileEntity, 10);
    this.waterBombPool = new ProjectilePool(WaterBombEntity, 20);
    this.earthWavePool = new ProjectilePool(EarthWaveEntity, 10);
    this.basicAttackPool = new ProjectilePool(BasicAttackEntity, 30);

    // Water puddle pool (not entity-managed, manual pool)
    this.waterPuddles = [];
    for (let i = 0; i < 10; i++) {
      this.waterPuddles.push(new WaterPuddle());
    }

    // Lightning strike effect manager
    this.lightningEffect = new LightningStrikeEffect();

    // Canvas dimensions
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    // Player reference for spell origin
    this.player = null;

    // Camera reference for viewport calculations
    this.camera = null;

    // Enemy pools reference for lightning targeting
    this.enemyPools = null;

    // Active seeking missile reference (for waypoint redirection)
    this.activeSeekingMissile = null;
  }

  setPlayer(player) {
    this.player = player;
  }

  setCanvasSize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  setEnemyPools(enemyPools) {
    this.enemyPools = enemyPools;
  }

  castSpell(gestureResult) {
    const { name, damageModifier, trajectory, fromKeyboard, rawPoints } = gestureResult;

    let origin;
    if (this.player) {
      origin = { x: this.player.x, y: this.player.y };
    } else {
      origin = { x: this.canvasWidth / 2, y: this.canvasHeight / 2 };
    }

    let direction;
    if (trajectory) {
      direction = trajectory.direction;
    } else if (fromKeyboard) {
      direction = { x: 1, y: 0 };
    } else {
      return;
    }

    const config = SPELL_CONFIG[name];
    if (!config) {
      console.warn(`SpellCaster: No config found for spell "${name}"`);
      return;
    }

    switch (name) {
      case 'star':
        this.castSeekingMissile(origin, direction, damageModifier, config, rawPoints);
        break;
      case 'circle':
        this.castWaterBomb(origin, direction, damageModifier, config);
        break;
      case 'line':
        this.castLightningStrike(damageModifier, config);
        break;
      case 'triangle':
        this.castEarthWave(origin, damageModifier, config);
        break;
      case 'basic':
        this.castBasicAttack(origin, direction, damageModifier, config);
        break;
      default:
        console.warn(`SpellCaster: Unknown spell type "${name}"`);
    }
  }

  castSeekingMissile(origin, direction, damageModifier, config, rawPoints) {
    // If active missile exists and is alive, redirect it
    if (this.activeSeekingMissile && this.activeSeekingMissile.active) {
      if (rawPoints && rawPoints.length >= 2) {
        this.activeSeekingMissile.setWaypoints(rawPoints);
      }
      return;
    }

    const vx = direction.x * config.speed;
    const vy = direction.y * config.speed;

    const projectile = this.seekingMissilePool.spawn({
      x: origin.x,
      y: origin.y,
      vx, vy,
      damageModifier
    });

    if (projectile) {
      // Set waypoints from drawn path
      if (rawPoints && rawPoints.length >= 2) {
        projectile.setWaypoints(rawPoints);
      }
      this.entityManager.add(projectile);
      this.activeSeekingMissile = projectile;
    }
  }

  castWaterBomb(origin, direction, damageModifier, config) {
    const vx = direction.x * config.speed;
    const vy = direction.y * config.speed;

    const projectile = this.waterBombPool.spawn({
      x: origin.x,
      y: origin.y,
      vx, vy,
      damageModifier
    });

    if (projectile) {
      // Set explosion callback to spawn puddle
      projectile.onHitCallback = (px, py, dm) => {
        this.spawnPuddle(px, py);
      };
      this.entityManager.add(projectile);
    }
  }

  castLightningStrike(damageModifier, config) {
    if (!this.enemyPools) return;

    // Find all active enemies
    const allEnemies = [];
    for (const key in this.enemyPools) {
      for (const enemy of this.enemyPools[key].getActive()) {
        if (!enemy.active) continue;
        if (enemy.isPhased) continue;

        // Filter to viewport if camera exists
        if (this.camera) {
          const inView = enemy.x >= this.camera.x && enemy.x <= this.camera.x + this.camera.viewWidth &&
                         enemy.y >= this.camera.y && enemy.y <= this.camera.y + this.camera.viewHeight;
          if (!inView) continue;
        }

        allEnemies.push(enemy);
      }
    }

    if (allEnemies.length === 0) return;

    // Sort by HP descending, take top N
    allEnemies.sort((a, b) => b.hp - a.hp);
    const targets = allEnemies.slice(0, config.targets);

    // Deal damage to each target
    for (const target of targets) {
      let damage = config.baseDamage * damageModifier;

      // Accessory damage modifiers
      if (this.player && this.player.accessorySystem) {
        damage *= this.player.accessorySystem.getDamageModifier();
        damage *= this.player.accessorySystem.rollCritical();
      }

      target.takeDamage(damage);

      // Life steal
      if (this.player && this.player.accessorySystem) {
        this.player.accessorySystem.onPlayerHitEnemy();
      }
    }

    // Create visual lightning bolts
    this.lightningEffect.strike(targets, this.camera, damageModifier);
  }

  castEarthWave(origin, damageModifier, config) {
    const projectile = this.earthWavePool.spawn({
      x: origin.x,
      y: origin.y,
      vx: 0, vy: 0,
      damageModifier
    });

    if (projectile) {
      this.entityManager.add(projectile);
    }
  }

  castBasicAttack(origin, direction, damageModifier, config) {
    const vx = direction.x * config.speed;
    const vy = direction.y * config.speed;

    const projectile = this.basicAttackPool.spawn({
      x: origin.x,
      y: origin.y,
      vx, vy,
      damageModifier
    });

    if (projectile) {
      this.entityManager.add(projectile);
    }
  }

  spawnPuddle(x, y) {
    for (const puddle of this.waterPuddles) {
      if (!puddle.active) {
        puddle.spawn(x, y);
        return puddle;
      }
    }
    return null;
  }

  getActivePuddles() {
    return this.waterPuddles.filter(p => p.active);
  }

  getLightningEffect() {
    return this.lightningEffect;
  }

  update(dt) {
    // Update all projectile pools
    this.seekingMissilePool.update(dt);
    this.waterBombPool.update(dt);
    this.earthWavePool.update(dt);
    this.basicAttackPool.update(dt);

    // Update water puddles
    for (const puddle of this.waterPuddles) {
      if (puddle.active) puddle.update(dt);
    }

    // Update lightning effects
    this.lightningEffect.update(dt);

    // Clean up active seeking missile ref if it's dead
    if (this.activeSeekingMissile && !this.activeSeekingMissile.active) {
      this.activeSeekingMissile = null;
    }
  }
}

export default SpellCaster;
