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

  // Actions
  setGameState: (state) => set({ gameState: state }),
  setFPS: (fps) => set({ fps }),
}));
