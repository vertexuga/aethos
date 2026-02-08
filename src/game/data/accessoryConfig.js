export const ACCESSORY_CONFIG = {
  swiftBoots: {
    name: 'Swift Boots',
    emoji: '🥾',
    color: '#ff9800',
    description: 'Enchanted boots that quicken your step.',
    tiers: {
      1: { description: '+20% movement speed' },
      2: { description: '+20% speed + fire trail (5 dmg/s)' },
      3: { description: '+20% speed + fire trail + double-tap dash' },
    },
  },
  regenPendant: {
    name: 'Regen Pendant',
    emoji: '💚',
    color: '#4caf50',
    description: 'A pendant that slowly mends your wounds.',
    tiers: {
      1: { description: 'Heal 1 HP/sec' },
      2: { description: 'Heal 2 HP/sec' },
      3: { description: 'Heal 3 HP/sec + heal 15 at 30% HP (60s cd)' },
    },
  },
  vampireRing: {
    name: 'Vampire Ring',
    emoji: '🩸',
    color: '#b71c1c',
    description: 'A blood-red ring that drains life from foes.',
    tiers: {
      1: { description: '+5 HP per kill' },
      2: { description: '+5 HP/kill + 3 HP life steal per hit' },
      3: { description: '+18 HP/kill + 6 HP steal + spree full heal' },
    },
  },
  manaHeartAmulet: {
    name: 'Mana Heart Amulet',
    emoji: '💙',
    color: '#42a5f5',
    description: 'Channels desperation into arcane power.',
    tiers: {
      1: { description: 'Below 25% HP: 2x mana regen' },
      2: { description: 'Below 50% HP: 2x mana regen' },
      3: { description: 'Below 25% HP: free spells 5s (1x/fight)' },
    },
  },
  phoenixFeather: {
    name: 'Phoenix Feather',
    emoji: '🔥',
    color: '#ff6e40',
    description: 'Burns with undying flame.',
    tiers: {
      1: { description: 'Revive at 30% HP (1x/level)' },
      2: { description: 'Revive at 50% HP + 3s invulnerability' },
      3: { description: 'Revive 100% HP + 3s invuln + explosion' },
    },
  },
  arcaneBattery: {
    name: 'Arcane Battery',
    emoji: '🔋',
    color: '#7cb342',
    description: 'Stores extra arcane energy.',
    tiers: {
      1: { description: '+20 max mana' },
      2: { description: '+40 max mana' },
      3: { description: '+60 max mana + reduced spell cost' },
    },
  },
  manaSiphonRing: {
    name: 'Mana Siphon Ring',
    emoji: '💫',
    color: '#ba68c8',
    description: 'Siphons mana from fallen enemies.',
    tiers: {
      1: { description: '+5 mana per kill' },
      2: { description: '+10 mana per kill' },
      3: { description: '+15 mana/kill + 30 from elites' },
    },
  },
  powerGauntlets: {
    name: 'Power Gauntlets',
    emoji: '💪',
    color: '#ef5350',
    description: 'Amplify your arcane power.',
    tiers: {
      1: { description: '+10% spell damage' },
      2: { description: '+20% spell damage' },
      3: { description: '+30% damage + 10% crit (2x)' },
    },
  },
  treasureCompass: {
    name: "Hunter's Compass",
    emoji: '🧭',
    color: '#fdd835',
    description: 'Points toward hidden treasures.',
    tiers: {
      1: { description: '+20% material drops' },
      2: { description: '+40% material drops' },
      3: { description: '+60% drops + guaranteed rare' },
    },
  },
  luckyFoot: {
    name: "Lucky Rabbit's Foot",
    emoji: '🍀',
    color: '#66bb6a',
    description: 'Fortune favors the prepared.',
    tiers: {
      1: { description: '5% chance double drops' },
      2: { description: '10% chance double drops' },
      3: { description: '15% double + 5% triple drops' },
    },
  },
  guardianBarrier: {
    name: 'Guardian Barrier',
    emoji: '🛡️',
    color: '#29b6f6',
    description: 'Ancient ward that activates in dire need.',
    tiers: {
      1: { description: '5s invuln shield at 50% HP (1x/fight)' },
      2: { description: 'Shield + knockback damage' },
      3: { description: 'Shield + knockback + molten rocks' },
    },
  },
  guardianSoldier: {
    name: 'Guardian Soldier',
    emoji: '⚔️',
    color: '#8d6e63',
    description: 'A spectral warrior bound to protect you.',
    tiers: {
      1: { description: 'Summon soldier (20s respawn)' },
      2: { description: 'Stronger soldier (10s respawn)' },
      3: { description: 'Two strong soldiers (10s respawn)' },
    },
  },
  guardianHealer: {
    name: 'Guardian Healer',
    emoji: '✨',
    color: '#81c784',
    description: 'A healing spirit that mends your wounds.',
    tiers: {
      1: { description: 'Healer shoots heal every 5s' },
      2: { description: 'Healer + healing puddles on ground' },
      3: { description: 'Heal puddles also poison enemies' },
    },
  },
};

// Which enemies can drop accessories and their drop chance
export const ACCESSORY_DROP_CHANCE = {
  gravityWell: 0.08,
  phaseWraith: 0.06,
  riftCaller: 0.10,
  curseHexer: 0.10,
};

// All accessory IDs for random selection
export const ACCESSORY_IDS = Object.keys(ACCESSORY_CONFIG);
