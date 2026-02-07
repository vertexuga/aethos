import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Game state
  gameState: 'menu', // 'menu' | 'playing' | 'paused'
  fps: 0,

  // Player state (placeholder for future phases)
  playerHP: 100,
  playerMaxHP: 100,
  mana: 0,
  maxMana: 100,

  // Gesture state
  lastGesture: null, // { name, score, damageModifier } or null
  isDrawing: false,

  // Actions
  setGameState: (state) => set({ gameState: state }),
  setFPS: (fps) => set({ fps }),
  setLastGesture: (gesture) => set({ lastGesture: gesture }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  clearGesture: () => set({ lastGesture: null }),
}));
