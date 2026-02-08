import { useGameStore } from '../../stores/gameStore.js';
import { CRAFTED_SPELL_CONFIG } from '../data/craftedSpellConfig.js';
import PhantomDecoy from '../entities/craftedSpells/PhantomDecoy.js';
import BlinkStep from '../entities/craftedSpells/BlinkStep.js';
import StasisField from '../entities/craftedSpells/StasisField.js';
import EchoStrike from '../entities/craftedSpells/EchoStrike.js';
import SmokeBomb from '../entities/craftedSpells/SmokeBomb.js';
import WispCompanion from '../entities/craftedSpells/WispCompanion.js';
import CurseChain from '../entities/craftedSpells/CurseChain.js';

class CraftedSpellCaster {
  constructor(player, enemyPools) {
    this.player = player;
    this.enemyPools = enemyPools;

    // Spell instances (reusable)
    this.spellInstances = {
      phantomDecoy: new PhantomDecoy(),
      blinkStep: new BlinkStep(),
      stasisField: new StasisField(),
      echoStrike: new EchoStrike(),
      smokeBomb: new SmokeBomb(),
      wispCompanion: new WispCompanion(),
      curseChain: new CurseChain(),
    };

    // Cooldown timers per spell (ms remaining)
    this.cooldowns = {};
    for (const id in CRAFTED_SPELL_CONFIG) {
      this.cooldowns[id] = 0;
    }
  }

  castSlot(slotIndex) {
    const store = useGameStore.getState();
    const spellId = store.equippedCrafted[slotIndex];
    if (!spellId) return false;

    // Check ownership (tier > 0 means owned)
    const tier = store.craftedSpells[spellId] || 0;
    if (tier <= 0) return false;

    // Check cooldown
    if (this.cooldowns[spellId] > 0) return false;

    const config = CRAFTED_SPELL_CONFIG[spellId];
    if (!config) return false;

    // Check mana (free mana from Mana Heart Amulet, cost reduction from Arcane Battery)
    let manaCost = config.manaCost;
    const accSys = this.player.accessorySystem;
    if (accSys && accSys.isFreeMana()) {
      manaCost = 0;
    } else if (accSys && accSys.tier('arcaneBattery') >= 3) {
      manaCost = Math.floor(manaCost * 0.8);
    }
    if (store.mana < manaCost) return false;

    // Special case: EchoStrike can be recast (second activation)
    if (spellId === 'echoStrike' && this.spellInstances.echoStrike.phase === 'first') {
      this.spellInstances.echoStrike.activate(this.player, this.enemyPools, tier);
      return true;
    }

    // Check if spell instance is already active (non-recastable)
    const instance = this.spellInstances[spellId];
    if (instance && instance.active && spellId !== 'echoStrike') return false;

    // Spend mana
    store.useMana(manaCost);

    // Set cooldown
    this.cooldowns[spellId] = config.cooldown;

    // Activate spell with tier
    if (instance) {
      instance.activate(this.player, this.enemyPools, tier);
    }

    return true;
  }

  getCooldownPercent(spellId) {
    const config = CRAFTED_SPELL_CONFIG[spellId];
    if (!config || config.cooldown <= 0) return 0;
    return Math.max(0, this.cooldowns[spellId] / config.cooldown);
  }

  // Called by BlinkStep tier 3 to reset its own cooldown
  resetCooldown(spellId) {
    this.cooldowns[spellId] = 0;
  }

  update(dt) {
    // Update cooldowns
    for (const id in this.cooldowns) {
      if (this.cooldowns[id] > 0) {
        this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt * 1000);
      }
    }

    // Update active spell effects
    for (const id in this.spellInstances) {
      const instance = this.spellInstances[id];
      if (instance.active) {
        instance.update(dt);
      }
    }

    // Handle player invisibility from Phantom Decoy
    if (this.player._phantomInvisible) {
      this.player._renderAlphaOverride = this.player._invisAlpha || 0.15;
    } else {
      delete this.player._renderAlphaOverride;
    }
  }

  render(ctx) {
    // Render active spell effects
    for (const id in this.spellInstances) {
      const instance = this.spellInstances[id];
      if (instance.active || (id === 'echoStrike' && instance.explosionPos)) {
        instance.render(ctx);
      }
    }
  }
}

export default CraftedSpellCaster;
