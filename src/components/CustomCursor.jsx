import React, { useState, useEffect } from 'react';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setIsActive(true);
    const handleMouseUp = () => setIsActive(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9999,
          borderRadius: '50%',
          width: isActive ? '6px' : '8px',
          height: isActive ? '6px' : '8px',
          backgroundColor: isActive ? '#7eb8da' : '#f4e8c1',
          boxShadow: `0 0 10px ${isActive ? '#7eb8da' : '#f4e8c1'}`,
          transition: 'width 0.2s, height 0.2s',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9999,
          borderRadius: '50%',
          width: isActive ? '350px' : '400px',
          height: isActive ? '350px' : '400px',
          background: isActive
            ? 'radial-gradient(circle, rgba(74, 143, 143, 0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(126, 184, 218, 0.15) 0%, rgba(126, 184, 218, 0.05) 30%, transparent 70%)',
          mixBlendMode: 'screen',
          transition: 'width 0.3s, height 0.3s',
        }}
      />
    </>
  );
};

export default CustomCursor;
