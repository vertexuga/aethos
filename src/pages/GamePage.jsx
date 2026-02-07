import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameEngine from '../game/engine/GameEngine';
import { useGameStore } from '../stores/gameStore';

const GamePage = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const navigate = useNavigate();
  const fps = useGameStore(state => state.fps);
  const setGameState = useGameStore(state => state.setGameState);
  const [entityCount, setEntityCount] = React.useState(0);

  useEffect(() => {
    // Create and initialize game engine
    const engine = new GameEngine(canvasRef.current);
    engine.init();
    engineRef.current = engine;

    // Update game state
    setGameState('playing');

    // Update entity count periodically
    const intervalId = setInterval(() => {
      if (engineRef.current && engineRef.current.entityManager) {
        setEntityCount(engineRef.current.entityManager.count);
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
    };
  }, [setGameState]);

  const handleBackToMenu = () => {
    navigate('/');
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
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
      />

      {/* Back to Menu button */}
      <button
        onClick={handleBackToMenu}
        className="font-cinzel"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '12px 24px',
          backgroundColor: 'rgba(74, 143, 143, 0.3)',
          color: '#f4e8c1',
          border: '1px solid rgba(126, 184, 218, 0.5)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          textShadow: '0 0 10px rgba(244, 232, 193, 0.4)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(74, 143, 143, 0.5)';
          e.target.style.borderColor = 'rgba(126, 184, 218, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(74, 143, 143, 0.3)';
          e.target.style.borderColor = 'rgba(126, 184, 218, 0.5)';
        }}
      >
        Back to Menu
      </button>

      {/* FPS and Entity Count display */}
      <div
        className="font-cormorant"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          backgroundColor: 'rgba(10, 10, 18, 0.7)',
          color: '#7eb8da',
          border: '1px solid rgba(126, 184, 218, 0.3)',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'monospace',
          zIndex: 1000
        }}
      >
        FPS: {fps} | Entities: {entityCount}
      </div>
    </div>
  );
};

export default GamePage;
