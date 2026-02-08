import React from 'react';

const GameOverPanel = ({ reason, onReturnToMenu }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 5, 15, 0.92)',
        fontFamily: 'monospace',
        animation: 'fadeIn 0.5s ease-in',
      }}
    >
      <div style={{
        color: '#f44336',
        fontSize: '32px',
        fontWeight: 'bold',
        textShadow: '0 0 20px rgba(244,67,54,0.6)',
        marginBottom: '12px',
      }}>
        Crystal Destroyed
      </div>

      <div style={{ color: '#999', fontSize: '14px', marginBottom: '30px' }}>
        The crystal shattered. Your base has fallen.
      </div>

      <button
        onClick={onReturnToMenu}
        className="font-cinzel"
        style={{
          padding: '14px 32px',
          backgroundColor: 'rgba(74, 143, 143, 0.3)',
          color: '#f4e8c1',
          border: '1px solid rgba(126, 184, 218, 0.5)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          fontFamily: 'monospace',
          textShadow: '0 0 10px rgba(244, 232, 193, 0.4)',
          transition: 'all 0.3s ease',
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
        Return to Menu
      </button>
    </div>
  );
};

export default GameOverPanel;
