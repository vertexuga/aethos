import { create } from 'zustand';
import { CRAFTED_SPELL_CONFIG } from '../game/data/craftedSpellConfig.js';

export const useGameStore = create((set, get) => ({
  // Game state
  gameState: 'menu', // 'menu' | 'playing' | 'paused'
  fps: 0,

  // Player state
  playerHP: 100,
  playerMaxHP: 100,
  mana: 100,
  maxMana: 100,

  // Gesture state
  lastGesture: null,
  isDrawing: false,
  gestureHistory: [],

  // Inventory (material counts)
  inventory: {
    mirrorShard: 100,
    voidCore: 100,
    etherWisp: 100,
    portalStone: 100,
    hexThread: 100,
  },

  // Crafting - craftedSpells is now { spellId: tierLevel } e.g. { smokeBomb: 1, blinkStep: 2 }
  discoveredRecipes: [],
  craftedSpells: {},
  equippedCrafted: [null, null],

  // Spell Forge UI
  spellForgeOpen: false,

  // Floating pickup texts
  pickupTexts: [],

  // Actions
  setGameState: (state) => set({ gameState: state }),
  setFPS: (fps) => set({ fps }),
  setLastGesture: (gesture) => set({ lastGesture: gesture }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  clearGesture: () => set({ lastGesture: null }),
  addGestureHistory: (gesture) => set(state => ({
    gestureHistory: [...state.gestureHistory.slice(-9), gesture]
  })),

  // Inventory actions
  addMaterial: (type, count = 1) => set(state => ({
    inventory: {
      ...state.inventory,
      [type]: (state.inventory[type] || 0) + count,
    },
    pickupTexts: [
      ...state.pickupTexts.slice(-4),
      { type, count, id: Date.now() + Math.random(), time: Date.now() },
    ],
  })),

  removeMaterials: (recipe) => set(state => {
    const newInventory = { ...state.inventory };
    for (const [mat, count] of Object.entries(recipe)) {
      newInventory[mat] = (newInventory[mat] || 0) - count;
    }
    return { inventory: newInventory };
  }),

  // Get the tier of a spell (0 if not owned)
  getSpellTier: (spellId) => {
    return get().craftedSpells[spellId] || 0;
  },

  // Crafting actions - handles both initial craft (tier 0->1) and upgrades (1->2, 2->3)
  craftSpell: (spellId, targetTier) => {
    const state = get();
    const config = CRAFTED_SPELL_CONFIG[spellId];
    if (!config) return false;

    const currentTier = state.craftedSpells[spellId] || 0;
    const nextTier = targetTier || (currentTier + 1);

    // Can't go above tier 3
    if (nextTier > 3 || nextTier <= currentTier) return false;

    // Get the materials needed
    let materials;
    if (nextTier === 1) {
      materials = config.materials; // Base recipe
    } else {
      const tierData = config.tiers[nextTier];
      if (!tierData || !tierData.materials) return false;
      materials = tierData.materials;
    }

    // Check materials
    for (const [mat, count] of Object.entries(materials)) {
      if ((state.inventory[mat] || 0) < count) return false;
    }

    // Deduct materials and set tier
    const newInventory = { ...state.inventory };
    for (const [mat, count] of Object.entries(materials)) {
      newInventory[mat] -= count;
    }

    set({
      inventory: newInventory,
      craftedSpells: { ...state.craftedSpells, [spellId]: nextTier },
    });
    return true;
  },

  equipCraftedSpell: (slot, spellId) => set(state => {
    const newEquipped = [...state.equippedCrafted];
    // Unequip from other slot if already equipped there
    const otherSlot = slot === 0 ? 1 : 0;
    if (newEquipped[otherSlot] === spellId) {
      newEquipped[otherSlot] = null;
    }
    newEquipped[slot] = spellId;
    return { equippedCrafted: newEquipped };
  }),

  unequipCraftedSpell: (slot) => set(state => {
    const newEquipped = [...state.equippedCrafted];
    newEquipped[slot] = null;
    return { equippedCrafted: newEquipped };
  }),

  discoverRecipe: (spellId) => set(state => {
    if (state.discoveredRecipes.includes(spellId)) return state;
    return { discoveredRecipes: [...state.discoveredRecipes, spellId] };
  }),

  setSpellForgeOpen: (open) => set({ spellForgeOpen: open }),

  clearPickupText: (id) => set(state => ({
    pickupTexts: state.pickupTexts.filter(t => t.id !== id),
  })),

  // Mana actions
  setMana: (mana) => set({ mana: Math.max(0, Math.min(get().maxMana, mana)) }),
  useMana: (amount) => {
    const state = get();
    if (state.mana < amount) return false;
    set({ mana: state.mana - amount });
    return true;
  },

  // Reset for new game
  resetInventory: () => set({
    inventory: { mirrorShard: 0, voidCore: 0, etherWisp: 0, portalStone: 0, hexThread: 0 },
    discoveredRecipes: [],
    craftedSpells: {},
    equippedCrafted: [null, null],
    mana: 100,
    pickupTexts: [],
  }),
}));
