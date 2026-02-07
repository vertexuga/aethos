import ProjectilePool from './ProjectilePool.js';
import QuickShotEntity from '../entities/projectiles/QuickShotEntity.js';
import MagicMissileEntity from '../entities/projectiles/MagicMissileEntity.js';
import FireballEntity from '../entities/projectiles/FireballEntity.js';
import FireballExplosion from '../entities/projectiles/FireballExplosion.js';
import { SPELL_CONFIG } from '../data/spellConfig.js';

class SpellCaster {
  constructor(entityManager) {
    this.entityManager = entityManager;

    // Create projectile pools for each spell type
    this.quickShotPool = new ProjectilePool(QuickShotEntity, 30);
    this.magicMissilePool = new ProjectilePool(MagicMissileEntity, 30);
    this.fireballPool = new ProjectilePool(FireballEntity, 20);
    this.explosionPool = new ProjectilePool(FireballExplosion, 15);

    // Canvas dimensions for keyboard fallback default spawning
    this.canvasWidth = 0;
    this.canvasHeight = 0;
  }

  setCanvasSize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  castSpell(gestureResult) {
    const { name, damageModifier, trajectory, fromKeyboard } = gestureResult;

    // Determine spawn position and direction
    let origin, direction;

    if (trajectory) {
      // Use trajectory from drawn gesture
      origin = trajectory.origin;
      direction = trajectory.direction;
    } else if (fromKeyboard) {
      // Keyboard cast without trajectory - spawn at screen center, aim right
      origin = { x: this.canvasWidth / 2, y: this.canvasHeight / 2 };
      direction = { x: 1, y: 0 }; // Aim right
    } else {
      // No trajectory and not from keyboard - can't cast
      return;
    }

    // Look up spell configuration
    const config = SPELL_CONFIG[name];
    if (!config) {
      console.warn(`SpellCaster: No config found for spell "${name}"`);
      return;
    }

    // Calculate velocity from direction and spell speed
    const vx = direction.x * config.speed;
    const vy = direction.y * config.speed;

    // Spawn projectile from appropriate pool
    let projectile;
    switch (name) {
      case 'circle':
        projectile = this.quickShotPool.spawn({
          x: origin.x,
          y: origin.y,
          vx,
          vy,
          damageModifier
        });
        break;
      case 'triangle':
        projectile = this.magicMissilePool.spawn({
          x: origin.x,
          y: origin.y,
          vx,
          vy,
          damageModifier
        });
        break;
      case 'zigzag':
        projectile = this.fireballPool.spawn({
          x: origin.x,
          y: origin.y,
          vx,
          vy,
          damageModifier
        });
        // Set explosion callback for fireball
        if (projectile) {
          projectile.onExpire = (x, y, damageModifier) => {
            // Only spawn explosion if within canvas bounds
            if (x >= 0 && x <= this.canvasWidth && y >= 0 && y <= this.canvasHeight) {
              const explosion = this.explosionPool.spawn({ x, y, damageModifier });
              if (explosion) {
                this.entityManager.add(explosion);
              }
            }
          };
        }
        break;
      default:
        console.warn(`SpellCaster: Unknown spell type "${name}"`);
        return;
    }

    // Add projectile to entity manager
    if (projectile) {
      this.entityManager.add(projectile);
    }
  }

  update(dt) {
    // Update all projectile pools
    this.quickShotPool.update(dt);
    this.magicMissilePool.update(dt);
    this.fireballPool.update(dt);
    this.explosionPool.update(dt);
  }
}

export default SpellCaster;
