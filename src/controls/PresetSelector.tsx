import { useState } from 'react';
import { useSimulation } from '../core/useSimulation';
import type { ParameterValue } from '../types/index';

export interface Preset {
  name: string;
  config: Record<string, ParameterValue>;
  description?: string;
}

export interface PresetSelectorProps {
  presets: Preset[];
  variant?: 'pills' | 'dropdown' | 'cards';
  className?: string;
}

export function PresetSelector({ presets, variant, className }: PresetSelectorProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const setParameter = useSimulation((s) => s.setParameter);

  function applyPreset(preset: Preset, index: number) {
    for (const [key, value] of Object.entries(preset.config)) {
      setParameter(key, value);
    }
    setActiveIndex(index);
  }

  function renderPills() {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {presets.map((preset, index) => (
          <button
            key={preset.name}
            data-active={index === activeIndex}
            onClick={() => applyPreset(preset, index)}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              background: index === activeIndex ? 'var(--sim-accent)' : 'var(--sim-surface)',
              color: index === activeIndex ? 'white' : 'var(--sim-text)',
              border: `1px solid ${index === activeIndex ? 'var(--sim-accent)' : 'var(--sim-border)'}`,
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'var(--sim-font-family)',
              transition: 'background 0.15s',
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>
    );
  }

  function renderDropdown() {
    return (
      <select
        value={activeIndex !== null ? String(activeIndex) : ''}
        onChange={(e) => {
          const idx = parseInt(e.target.value, 10);
          if (!isNaN(idx) && presets[idx]) {
            applyPreset(presets[idx], idx);
          }
        }}
        style={{
          background: 'var(--sim-surface)',
          border: '1px solid var(--sim-border)',
          color: 'var(--sim-text)',
          borderRadius: 'var(--sim-radius-sm)',
          padding: '6px 12px',
          fontSize: '13px',
        }}
      >
        <option value="">Select preset...</option>
        {presets.map((preset, index) => (
          <option key={preset.name} value={index}>
            {preset.name}
          </option>
        ))}
      </select>
    );
  }

  function renderCards() {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '8px',
        }}
      >
        {presets.map((preset, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={preset.name}
              data-active={isActive}
              onClick={() => applyPreset(preset, index)}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--sim-radius-md)',
                textAlign: 'left' as const,
                background: isActive ? 'var(--sim-accent)' : 'var(--sim-surface)',
                color: isActive ? 'white' : 'var(--sim-text)',
                border: `1px solid ${isActive ? 'var(--sim-accent)' : 'var(--sim-border)'}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{preset.name}</div>
              {preset.description ? (
                <div
                  style={{
                    fontSize: '12px',
                    color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--sim-text-muted)',
                    marginTop: '4px',
                  }}
                >
                  {preset.description}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={className}>
      {variant === 'dropdown'
        ? renderDropdown()
        : variant === 'cards'
          ? renderCards()
          : renderPills()}
    </div>
  );
}
