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
  lastGesture: null, // { name, score, damageModifier, trajectory } or null
  isDrawing: false,
  gestureHistory: [], // Track recent gestures for stats

  // Actions
  setGameState: (state) => set({ gameState: state }),
  setFPS: (fps) => set({ fps }),
  setLastGesture: (gesture) => set({ lastGesture: gesture }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  clearGesture: () => set({ lastGesture: null }),
  addGestureHistory: (gesture) => set(state => ({
    gestureHistory: [...state.gestureHistory.slice(-9), gesture]
  })),
}));
