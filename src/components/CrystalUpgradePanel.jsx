import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { CRYSTAL_CONFIG } from '../game/data/crystalConfig';

const UPGRADE_ICONS = {
  fortify: '\u{1F6E1}',
  regen: '\u{2764}',
  earlyWarning: '\u{1F441}',
};

const CrystalUpgradePanel = ({ isOpen, onClose, onUpgrade }) => {
  const crystalUpgradeLevels = useGameStore(s => s.crystalUpgradeLevels);
  const crystalUpgradeTokens = useGameStore(s => s.crystalUpgradeTokens);
  const inventory = useGameStore(s => s.inventory);
  const crystalHP = useGameStore(s => s.crystalHP);
  const crystalMaxHP = useGameStore(s => s.crystalMaxHP);

  const upgrades = CRYSTAL_CONFIG.upgrades;

  const canAffordUpgrade = (type) => {
    const config = upgrades[type];
    const currentTier = crystalUpgradeLevels[type] || 0;
    const nextTier = currentTier + 1;
    if (nextTier > config.maxTier) return false;

    const tierData = config.tiers[nextTier];
    if (crystalUpgradeTokens < tierData.tokenCost) return false;
    for (const [mat, count] of Object.entries(tierData.cost)) {
      if ((inventory[mat] || 0) < count) return false;
    }
    return true;
  };

  const handleUpgrade = (type) => {
    if (!canAffordUpgrade(type)) return;
    if (onUpgrade) onUpgrade(type);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '380px',
        height: '100vh',
        backgroundColor: 'rgba(5, 8, 18, 0.95)',
        borderRight: '2px solid rgba(0, 229, 255, 0.4)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 2000,
        overflowY: 'auto',
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
        color: '#f4e8c1',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#00e5ff', fontSize: '18px', textShadow: '0 0 10px rgba(0, 229, 255, 0.6)' }}>
          Crystal Upgrades
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            color: '#7eb8da',
            cursor: 'pointer',
            padding: '4px 10px',
            fontFamily: 'monospace',
            fontSize: '14px',
            borderRadius: '3px',
          }}
        >
          [C] Close
        </button>
      </div>

      {/* Crystal Status */}
      <div style={{
        padding: '12px',
        backgroundColor: 'rgba(0, 229, 255, 0.08)',
        border: '1px solid rgba(0, 229, 255, 0.2)',
        borderRadius: '4px',
        marginBottom: '16px',
      }}>
        <div style={{ color: '#00e5ff', fontSize: '12px', marginBottom: '6px' }}>Crystal HP</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '4px' }}>
            <div style={{
              width: `${(crystalHP / crystalMaxHP) * 100}%`,
              height: '100%',
              backgroundColor: crystalHP / crystalMaxHP > 0.6 ? '#00e5ff' : crystalHP / crystalMaxHP > 0.3 ? '#ffc107' : '#f44336',
              borderRadius: '4px',
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: '11px', color: '#7eb8da' }}>{Math.ceil(crystalHP)}/{crystalMaxHP}</span>
        </div>
        <div style={{ fontSize: '11px', color: '#7eb8da', marginTop: '6px' }}>
          Upgrade Tokens: <span style={{ color: '#ffd700' }}>{crystalUpgradeTokens}</span>
        </div>
      </div>

      {/* Upgrade Paths */}
      {Object.entries(upgrades).map(([type, config]) => {
        const currentTier = crystalUpgradeLevels[type] || 0;
        const nextTier = currentTier + 1;
        const maxed = nextTier > config.maxTier;
        const tierData = maxed ? null : config.tiers[nextTier];
        const affordable = canAffordUpgrade(type);

        return (
          <div
            key={type}
            style={{
              padding: '14px',
              backgroundColor: 'rgba(0, 229, 255, 0.04)',
              border: `1px solid rgba(0, 229, 255, ${maxed ? 0.1 : affordable ? 0.4 : 0.15})`,
              borderRadius: '4px',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#00e5ff', fontSize: '14px' }}>
                {UPGRADE_ICONS[type]} {config.name}
              </span>
              <span style={{ fontSize: '11px', color: '#7eb8da' }}>
                Tier {currentTier}/{config.maxTier}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              {config.description}
            </div>

            {/* Tier pips */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {Array.from({ length: config.maxTier }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: '20px',
                    height: '4px',
                    backgroundColor: i < currentTier ? '#00e5ff' : 'rgba(126, 184, 218, 0.2)',
                    borderRadius: '2px',
                  }}
                />
              ))}
            </div>

            {!maxed && tierData && (
              <>
                <div style={{ fontSize: '10px', color: '#888', marginTop: '8px' }}>
                  Cost: {Object.entries(tierData.cost).map(([mat, count]) => {
                    const have = inventory[mat] || 0;
                    return (
                      <span key={mat} style={{ marginRight: '8px', color: have >= count ? '#4caf50' : '#f44336' }}>
                        {mat}: {have}/{count}
                      </span>
                    );
                  })}
                  <span style={{ color: crystalUpgradeTokens >= tierData.tokenCost ? '#ffd700' : '#f44336' }}>
                    Tokens: {crystalUpgradeTokens}/{tierData.tokenCost}
                  </span>
                </div>
                <button
                  onClick={() => handleUpgrade(type)}
                  disabled={!affordable}
                  style={{
                    marginTop: '8px',
                    padding: '6px 14px',
                    backgroundColor: affordable ? 'rgba(0, 229, 255, 0.2)' : 'rgba(100, 100, 100, 0.1)',
                    border: `1px solid ${affordable ? 'rgba(0, 229, 255, 0.5)' : 'rgba(100, 100, 100, 0.2)'}`,
                    color: affordable ? '#00e5ff' : '#666',
                    cursor: affordable ? 'pointer' : 'default',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    borderRadius: '3px',
                    width: '100%',
                  }}
                >
                  {affordable ? `Upgrade to Tier ${nextTier}` : 'Insufficient Resources'}
                </button>
              </>
            )}

            {maxed && (
              <div style={{ fontSize: '11px', color: '#ffd700', marginTop: '8px' }}>
                MAX LEVEL
              </div>
            )}
          </div>
        );
      })}

      <div style={{ fontSize: '10px', color: '#555', marginTop: '16px', textAlign: 'center' }}>
        Tokens drop from dungeon loot chests
      </div>
    </div>
  );
};

export default CrystalUpgradePanel;
