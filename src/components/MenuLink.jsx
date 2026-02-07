import React, { useState } from 'react';

const MenuLink = ({ children, subtitle, onClick, isDepart = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href="#"
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
      }}
      style={{
        transition: 'all 0.5s ease-out',
        opacity: isHovered ? 1 : 0.6,
        paddingLeft: isHovered ? '20px' : 0,
        color: isHovered ? '#f4e8c1' : 'inherit',
        textShadow: isHovered ? '0 0 20px rgba(244, 232, 193, 0.4)' : 'none',
      }}
    >
      {isHovered && (
        <>
          <span
            style={{
              content: '',
              position: 'absolute',
              left: '-50px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '1px',
              background: 'linear-gradient(90deg, #7eb8da, transparent)',
              opacity: 1,
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '-20px',
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              color: '#4a8f8f',
              fontSize: '10px',
            }}
          >
            ♦
          </span>
        </>
      )}
      {children}
      {subtitle && (
        <span
          className="block font-cormorant text-sm tracking-widest text-[#4a8f8f] mt-1"
          style={{
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.5s',
          }}
        >
          {subtitle}
        </span>
      )}
    </a>
  );
};

export default MenuLink;
