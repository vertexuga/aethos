import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { CRAFTED_SPELL_CONFIG, CRAFTED_SPELL_IDS } from '../game/data/craftedSpellConfig';
import { MATERIAL_CONFIG } from '../game/data/materialConfig';

// SVG-based material icons for more visual interest
const MaterialIcon = ({ materialKey, size = 14 }) => {
  const mat = MATERIAL_CONFIG[materialKey];
  if (!mat) return null;

  const s = size;

  const icons = {
    mirrorShard: (
      <svg width={s} height={s} viewBox="0 0 16 16">
        <polygon points="8,1 14,6 11,15 5,15 2,6" fill={mat.color} opacity="0.9" />
        <polygon points="8,3 12,6.5 10,13 6,13 4,6.5" fill="#fff" opacity="0.3" />
        <line x1="8" y1="1" x2="8" y2="6" stroke="#fff" strokeWidth="0.5" opacity="0.5" />
      </svg>
    ),
    voidCore: (
      <svg width={s} height={s} viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" fill="#0d0d1a" />
        <circle cx="8" cy="8" r="5" fill="none" stroke="#4a148c" strokeWidth="1" opacity="0.8" />
        <circle cx="8" cy="8" r="3" fill="none" stroke="#7c4dff" strokeWidth="0.5" opacity="0.6" />
        <circle cx="8" cy="8" r="1.5" fill="#7c4dff" opacity="0.4" />
      </svg>
    ),
    etherWisp: (
      <svg width={s} height={s} viewBox="0 0 16 16">
        <ellipse cx="8" cy="8" rx="5" ry="3" fill={mat.color} opacity="0.5" transform="rotate(-20 8 8)" />
        <ellipse cx="8" cy="8" rx="3" ry="5" fill={mat.color} opacity="0.3" transform="rotate(30 8 8)" />
        <circle cx="8" cy="8" r="2" fill="#fff" opacity="0.6" />
        <path d="M6,5 Q8,2 10,5" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
      </svg>
    ),
    portalStone: (
      <svg width={s} height={s} viewBox="0 0 16 16">
        <rect x="4" y="4" width="8" height="8" rx="2" fill={mat.color} opacity="0.8" transform="rotate(45 8 8)" />
        <rect x="5.5" y="5.5" width="5" height="5" rx="1" fill="#fff" opacity="0.15" transform="rotate(45 8 8)" />
        <circle cx="8" cy="8" r="1.5" fill="#fff" opacity="0.4" />
      </svg>
    ),
    hexThread: (
      <svg width={s} height={s} viewBox="0 0 16 16">
        <path d="M3,12 Q5,4 8,8 Q11,12 13,4" fill="none" stroke={mat.color} strokeWidth="2" opacity="0.8" />
        <path d="M3,12 Q5,4 8,8 Q11,12 13,4" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        <circle cx="8" cy="8" r="1" fill={mat.color} opacity="0.6" />
      </svg>
    ),
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: s, height: s, filter: `drop-shadow(0 0 3px ${mat.color})` }}>
      {icons[materialKey] || (
        <svg width={s} height={s} viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="5" fill={mat.color} />
        </svg>
      )}
    </span>
  );
};

const TIER_LABELS = ['', 'I', 'II', 'III'];
const TIER_COLORS = ['', '#b0bec5', '#ffd54f', '#ff6e40'];

const SpellForge = ({ isOpen, onClose }) => {
  const inventory = useGameStore(state => state.inventory);
  const craftedSpells = useGameStore(state => state.craftedSpells);
  const equippedCrafted = useGameStore(state => state.equippedCrafted);
  const maxEquipSlots = useGameStore(state => state.maxEquipSlots);
  const craftSpell = useGameStore(state => state.craftSpell);
  const equipCraftedSpell = useGameStore(state => state.equipCraftedSpell);
  const unequipCraftedSpell = useGameStore(state => state.unequipCraftedSpell);

  const getSpellTier = (spellId) => craftedSpells[spellId] || 0;

  const canAfford = (materials) => {
    for (const [mat, count] of Object.entries(materials)) {
      if ((inventory[mat] || 0) < count) return false;
    }
    return true;
  };

  const getNextTierMaterials = (spellId) => {
    const config = CRAFTED_SPELL_CONFIG[spellId];
    const currentTier = getSpellTier(spellId);
    const nextTier = currentTier + 1;
    if (nextTier > 3) return null;
    if (nextTier === 1) return config.materials;
    const tierData = config.tiers[nextTier];
    return tierData?.materials || null;
  };

  const isDiscovered = (spellId) => {
    const config = CRAFTED_SPELL_CONFIG[spellId];
    if (!config) return false;
    if (getSpellTier(spellId) > 0) return true;
    for (const mat of Object.keys(config.materials)) {
      if ((inventory[mat] || 0) >= 1) return true;
    }
    return false;
  };

  const handleCraft = (spellId) => {
    craftSpell(spellId);
  };

  const handleEquip = (slot, spellId) => {
    if (equippedCrafted[slot] === spellId) {
      unequipCraftedSpell(slot);
    } else {
      equipCraftedSpell(slot, spellId);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '380px',
      zIndex: 5000,
      backgroundColor: 'rgba(10, 10, 18, 0.94)',
      borderRight: '1px solid rgba(126, 184, 218, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 300ms ease-out',
      boxShadow: isOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
      overflowY: 'auto',
      pointerEvents: isOpen ? 'auto' : 'none',
    }}>
      {/* Title */}
      <h1 className="font-cinzel" style={{
        color: '#d4a574',
        fontSize: '22px',
        marginBottom: '12px',
        textShadow: '0 0 20px rgba(212, 165, 116, 0.5)',
        letterSpacing: '3px',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        SPELL FORGE
      </h1>

      {/* Materials bar */}
      <div style={{
        backgroundColor: 'rgba(30, 30, 50, 0.8)',
        border: '1px solid rgba(126, 184, 218, 0.3)',
        borderRadius: '6px',
        padding: '10px',
        marginBottom: '12px',
        flexShrink: 0,
      }}>
        <div style={{ color: '#7eb8da', fontSize: '11px', marginBottom: '6px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Materials
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.entries(MATERIAL_CONFIG).map(([key, mat]) => (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 6px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              flex: '1 0 auto',
              minWidth: '60px',
            }}>
              <MaterialIcon materialKey={key} size={16} />
              <span style={{ color: '#ccc', fontSize: '10px', fontFamily: 'monospace' }}>
                {mat.name.split(' ')[0]}
              </span>
              <span style={{ color: '#f4e8c1', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace', marginLeft: 'auto' }}>
                {inventory[key] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recipes */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '12px',
      }}>
        {CRAFTED_SPELL_IDS.map(spellId => {
          const config = CRAFTED_SPELL_CONFIG[spellId];
          const tier = getSpellTier(spellId);
          const owned = tier > 0;
          const discovered = isDiscovered(spellId);
          const nextMaterials = getNextTierMaterials(spellId);
          const canUpgrade = nextMaterials && canAfford(nextMaterials);
          const maxed = tier >= 3;

          return (
            <div key={spellId} style={{
              marginBottom: '8px',
              padding: '10px',
              backgroundColor: owned ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${owned ? 'rgba(76, 175, 80, 0.3)' : canUpgrade ? 'rgba(212, 165, 116, 0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '6px',
            }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    color: discovered ? '#f4e8c1' : '#555',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                  }}>
                    {discovered ? config.name : '???'}
                  </span>
                  <span style={{
                    color: '#7eb8da',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                  }}>
                    [{config.category}]
                  </span>
                  {/* Tier stars */}
                  {owned && (
                    <span style={{
                      color: TIER_COLORS[tier],
                      fontSize: '12px',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      textShadow: `0 0 6px ${TIER_COLORS[tier]}`,
                    }}>
                      {TIER_LABELS[tier]}
                    </span>
                  )}
                </div>

                {/* Action button */}
                {maxed ? (
                  <span style={{ color: '#ffd54f', fontSize: '10px', fontFamily: 'monospace' }}>MAX</span>
                ) : (
                  <button
                    onClick={() => handleCraft(spellId)}
                    disabled={!canUpgrade}
                    style={{
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      backgroundColor: canUpgrade ? 'rgba(212, 165, 116, 0.4)' : 'rgba(50,50,50,0.5)',
                      color: canUpgrade ? '#f4e8c1' : '#555',
                      border: `1px solid ${canUpgrade ? 'rgba(212, 165, 116, 0.6)' : 'rgba(50,50,50,0.3)'}`,
                      borderRadius: '4px',
                      cursor: canUpgrade ? 'pointer' : 'default',
                    }}
                  >
                    {owned ? `Upgrade ${TIER_LABELS[tier + 1]}` : 'Craft'}
                  </button>
                )}
              </div>

              {/* Equip buttons for owned spells */}
              {owned && (
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {Array.from({length: maxEquipSlots}, (_, i) => i).map(slot => (
                    <button
                      key={slot}
                      onClick={() => handleEquip(slot, spellId)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        backgroundColor: equippedCrafted[slot] === spellId
                          ? 'rgba(212, 165, 116, 0.4)'
                          : 'rgba(74, 143, 143, 0.2)',
                        color: '#f4e8c1',
                        border: '1px solid rgba(126, 184, 218, 0.3)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      {equippedCrafted[slot] === spellId ? `Slot ${slot + 1} *` : `Slot ${slot + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {discovered && (
                <>
                  {/* Current tier descriptions */}
                  <div style={{ marginBottom: '4px' }}>
                    {config.tiers && config.tiers.slice(1, (tier || 0) + 1).map((t, i) => (
                      t && <p key={i} style={{
                        color: '#8bc34a',
                        fontSize: '10px',
                        margin: '1px 0',
                        fontFamily: 'monospace',
                      }}>
                        {t.description}
                      </p>
                    ))}
                    {/* Next tier preview */}
                    {!maxed && config.tiers[tier + 1] && (
                      <p style={{
                        color: '#666',
                        fontSize: '10px',
                        margin: '1px 0',
                        fontFamily: 'monospace',
                        fontStyle: 'italic',
                      }}>
                        Next: {config.tiers[tier + 1].description}
                      </p>
                    )}
                  </div>

                  {/* Material costs for next tier */}
                  {nextMaterials && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {Object.entries(nextMaterials).map(([mat, count]) => {
                        const have = inventory[mat] || 0;
                        const enough = have >= count;
                        return (
                          <span key={mat} style={{
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            color: enough ? '#4caf50' : '#f44336',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}>
                            <MaterialIcon materialKey={mat} size={12} />
                            {have}/{count}
                          </span>
                        );
                      })}
                      <span style={{ fontSize: '10px', color: '#7eb8da', fontFamily: 'monospace' }}>
                        | {config.manaCost}mp | {(config.cooldown / 1000).toFixed(0)}s
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Loadout display */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '10px',
        flexShrink: 0,
      }}>
        {Array.from({length: maxEquipSlots}, (_, i) => i).map(slot => {
          const spellId = equippedCrafted[slot];
          const config = spellId ? CRAFTED_SPELL_CONFIG[spellId] : null;
          const tier = spellId ? getSpellTier(spellId) : 0;
          return (
            <div key={slot} style={{
              flex: 1,
              padding: '6px',
              backgroundColor: 'rgba(30, 30, 50, 0.8)',
              border: '1px solid rgba(126, 184, 218, 0.3)',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#7eb8da', fontSize: '10px', fontFamily: 'monospace', marginBottom: '2px' }}>
                Slot {slot + 1} [Key {slot + 1}]
              </div>
              <div style={{ color: config ? '#f4e8c1' : '#555', fontSize: '11px', fontFamily: 'monospace' }}>
                {config ? config.name : 'Empty'}
                {config && tier > 0 && (
                  <span style={{ color: TIER_COLORS[tier], marginLeft: '4px', textShadow: `0 0 4px ${TIER_COLORS[tier]}` }}>
                    {TIER_LABELS[tier]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="font-cinzel"
        style={{
          padding: '8px 20px',
          backgroundColor: 'rgba(74, 143, 143, 0.3)',
          color: '#f4e8c1',
          border: '1px solid rgba(126, 184, 218, 0.5)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: 'monospace',
          flexShrink: 0,
        }}
      >
        Close [Tab]
      </button>
    </div>
  );
};

export default SpellForge;
