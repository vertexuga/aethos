import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameEngine from '../game/engine/GameEngine';
import { useGameStore } from '../stores/gameStore';
import SpellForge from '../components/SpellForge';
import CrystalUpgradePanel from '../components/CrystalUpgradePanel';
import GameOverPanel from '../components/GameOverPanel';
import { CRYSTAL_CONFIG } from '../game/data/crystalConfig';

const GamePage = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const navigate = useNavigate();
  const fps = useGameStore(state => state.fps);
  const setGameState = useGameStore(state => state.setGameState);
  const spellForgeOpen = useGameStore(state => state.spellForgeOpen);
  const setSpellForgeOpen = useGameStore(state => state.setSpellForgeOpen);
  const crystalPanelOpen = useGameStore(state => state.crystalPanelOpen);
  const setCrystalPanelOpen = useGameStore(state => state.setCrystalPanelOpen);
  const [entityCount, setEntityCount] = React.useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [gameOver, setGameOver] = useState(null); // null | 'crystal'
  const [showMenuConfirm, setShowMenuConfirm] = useState(false);

  useEffect(() => {
    // Fade in from black after a frame
    requestAnimationFrame(() => setFadeIn(false));
  }, []);

  useEffect(() => {
    // Create and initialize game engine
    const engine = new GameEngine(canvasRef.current);
    engine.init();
    engineRef.current = engine;

    // Update game state
    setGameState('playing');

    // Update entity count and check game-over periodically
    const intervalId = setInterval(() => {
      if (engineRef.current && engineRef.current.entityManager) {
        setEntityCount(engineRef.current.entityManager.count);
      }
      // Check for game-over conditions (only crystal death)
      if (engineRef.current) {
        if (engineRef.current.crystal && !engineRef.current.crystal.active) {
          setGameOver('crystal');
          if (engineRef.current.gameLoop) engineRef.current.gameLoop.stop();
        }
      }
    }, 100);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      setGameState('menu');
      setSpellForgeOpen(false);
    };
  }, [setGameState, setSpellForgeOpen]);

  // Tab key to toggle Spell Forge
  useEffect(() => {
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const store = useGameStore.getState();
        const newOpen = !store.spellForgeOpen;
        setSpellForgeOpen(newOpen);

        // Pause/resume game loop
        if (engineRef.current && engineRef.current.gameLoop) {
          if (newOpen) {
            engineRef.current.gameLoop.stop();
          } else {
            engineRef.current.gameLoop.start();
          }
        }
      }
    };

    const handleCKey = (e) => {
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const store = useGameStore.getState();
        const newOpen = !store.crystalPanelOpen;
        setCrystalPanelOpen(newOpen);

        if (engineRef.current && engineRef.current.gameLoop) {
          if (newOpen) {
            engineRef.current.gameLoop.stop();
          } else {
            engineRef.current.gameLoop.start();
          }
        }
      }
    };

    window.addEventListener('keydown', handleTabKey);
    window.addEventListener('keydown', handleCKey);
    return () => {
      window.removeEventListener('keydown', handleTabKey);
      window.removeEventListener('keydown', handleCKey);
    };
  }, [setSpellForgeOpen, setCrystalPanelOpen]);

  const handleBackToMenu = () => {
    navigate('/');
  };

  const handleCloseForge = () => {
    setSpellForgeOpen(false);
    if (engineRef.current && engineRef.current.gameLoop) {
      engineRef.current.gameLoop.start();
    }
  };

  const handleCloseCrystalPanel = () => {
    setCrystalPanelOpen(false);
    if (engineRef.current && engineRef.current.gameLoop) {
      engineRef.current.gameLoop.start();
    }
  };

  const handleCrystalUpgrade = (type) => {
    const store = useGameStore.getState();
    const config = CRYSTAL_CONFIG.upgrades[type];
    const currentTier = store.crystalUpgradeLevels[type] || 0;
    const nextTier = currentTier + 1;
    if (nextTier > config.maxTier) return;

    const tierData = config.tiers[nextTier];

    // Deduct materials
    store.removeMaterials(tierData.cost);
    // Deduct tokens
    store.useCrystalUpgradeTokens(tierData.tokenCost);

    // Apply upgrade to crystal entity
    if (engineRef.current && engineRef.current.crystal) {
      engineRef.current.crystal.upgrade(type);
      store.setCrystalUpgradeLevels({ ...engineRef.current.crystal.upgradeLevels });
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      backgroundColor: '#0a0a12',
      position: 'relative'
    }}>
      {/* Video background behind game canvas */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* Back to Menu button (small) */}
      <button
        onClick={() => setShowMenuConfirm(true)}
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          padding: '4px 10px',
          backgroundColor: 'rgba(10, 10, 18, 0.5)',
          color: 'rgba(126, 184, 218, 0.6)',
          border: '1px solid rgba(126, 184, 218, 0.2)',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '10px',
          fontFamily: 'monospace',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(74, 143, 143, 0.4)';
          e.target.style.color = '#f4e8c1';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(10, 10, 18, 0.5)';
          e.target.style.color = 'rgba(126, 184, 218, 0.6)';
        }}
      >
        ESC Menu
      </button>

      {/* Menu confirmation dialog */}
      {showMenuConfirm && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 9998,
          backgroundColor: 'rgba(10, 10, 18, 0.85)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '20px',
        }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', color: '#f4e8c1' }}>
            Return to menu? Progress will be lost.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={handleBackToMenu}
              style={{
                padding: '8px 24px', backgroundColor: 'rgba(205, 92, 92, 0.4)',
                color: '#f4e8c1', border: '1px solid rgba(205, 92, 92, 0.6)',
                borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
                fontFamily: "'Cinzel Decorative', cursive",
              }}
            >Leave</button>
            <button
              onClick={() => setShowMenuConfirm(false)}
              style={{
                padding: '8px 24px', backgroundColor: 'rgba(74, 143, 143, 0.3)',
                color: '#f4e8c1', border: '1px solid rgba(126, 184, 218, 0.5)',
                borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
                fontFamily: "'Cinzel Decorative', cursive",
              }}
            >Stay</button>
          </div>
        </div>
      )}

      {/* FPS and Entity Count display — left of wave counter */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '140px',
          padding: '4px 10px',
          color: 'rgba(126, 184, 218, 0.5)',
          fontSize: '11px',
          fontFamily: 'monospace',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        FPS: {fps} | Entities: {entityCount}
      </div>

      {/* Spell Forge slide-in panel (always mounted for animation) */}
      <SpellForge isOpen={spellForgeOpen} onClose={handleCloseForge} />

      {/* Crystal Upgrade Panel (always mounted for animation) */}
      <CrystalUpgradePanel
        isOpen={crystalPanelOpen}
        onClose={handleCloseCrystalPanel}
        onUpgrade={handleCrystalUpgrade}
      />

      {/* Game Over overlay */}
      {gameOver && (
        <GameOverPanel reason={gameOver} onReturnToMenu={handleBackToMenu} />
      )}

      {/* Fade-in overlay from title screen transition */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 9999,
          backgroundColor: '#0a0a12',
          opacity: fadeIn ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.8s ease-in-out',
        }}
      />
    </div>
  );
};

export default GamePage;
