import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useSimulation } from '../core/useSimulation';
import { useParameters } from '../core/useSimulation';
import type { ParameterSchema, ParameterDef, ParameterValue } from '../types/index';

export interface ParameterPanelProps {
  schema: ParameterSchema;
  columns?: 1 | 2;
  compact?: boolean;
  className?: string;
}

export function ParameterPanel({ schema, columns, compact, className }: ParameterPanelProps) {
  const parameters = useParameters();
  const setParameter = useSimulation((s) => s.setParameter);
  const resetParameters = useSimulation((s) => s.resetParameters);

  const containerRef = useRef<HTMLDivElement>(null);
  const [autoColumns, setAutoColumns] = useState<1 | 2>(1);

  // ResizeObserver for auto-column detection at 320px breakpoint
  useEffect(() => {
    if (columns !== undefined || compact) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setAutoColumns(width >= 320 ? 2 : 1);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns, compact]);

  const cols = compact ? 1 : (columns ?? autoColumns);

  return (
    <div
      ref={containerRef}
      className={clsx('sim-panel', compact && 'sim-panel-compact', className)}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: compact ? '8px' : '16px',
        fontFamily: 'var(--sim-font-family)',
        color: 'var(--sim-text)',
      }}
    >
      {Object.entries(schema).map(([key, def]) => (
        <ControlField
          key={key}
          paramKey={key}
          def={def}
          value={parameters[key]}
          compact={compact}
          setParameter={setParameter}
        />
      ))}
      <div style={{ gridColumn: `1 / -1`, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="sim-reset-btn"
          onClick={() => resetParameters()}
          style={{
            background: 'transparent',
            color: 'var(--sim-text-muted)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '4px 8px',
          }}
        >
          Reset All
        </button>
      </div>
    </div>
  );
}

interface ControlFieldProps {
  paramKey: string;
  def: ParameterDef;
  value: ParameterValue | undefined;
  compact: boolean | undefined;
  setParameter: (key: string, value: ParameterValue) => void;
}

function ControlField({ paramKey, def, value, compact, setParameter }: ControlFieldProps) {
  switch (def.type) {
    case 'range':
      return (
        <RangeControl
          paramKey={paramKey}
          def={def}
          value={(value as number | undefined) ?? def.default}
          compact={compact}
          setParameter={setParameter}
        />
      );
    case 'toggle':
      return (
        <ToggleControl
          paramKey={paramKey}
          def={def}
          value={(value as boolean | undefined) ?? def.default}
          compact={compact}
          setParameter={setParameter}
        />
      );
    case 'select':
      return (
        <SelectControl
          paramKey={paramKey}
          def={def}
          value={(value as string | undefined) ?? def.default}
          compact={compact}
          setParameter={setParameter}
        />
      );
    case 'color':
      return (
        <ColorControl
          paramKey={paramKey}
          def={def}
          value={(value as string | undefined) ?? def.default}
          compact={compact}
          setParameter={setParameter}
        />
      );
    case 'vec2':
      return (
        <Vec2Control
          paramKey={paramKey}
          def={def}
          value={(value as [number, number] | undefined) ?? def.default}
          compact={compact}
          setParameter={setParameter}
        />
      );
    case 'group':
      return (
        <GroupControl
          def={def}
          compact={compact}
          setParameter={setParameter}
        />
      );
    default:
      return null;
  }
}

// ---- Range Control ----

function RangeControl({
  paramKey,
  def,
  value,
  compact,
  setParameter,
}: {
  paramKey: string;
  def: Extract<ParameterDef, { type: 'range' }>;
  value: number;
  compact: boolean | undefined;
  setParameter: (key: string, value: ParameterValue) => void;
}) {
  const label = def.label ?? paramKey;
  const step = def.step ?? 1;
  const pct = ((value - def.min) / (def.max - def.min)) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: compact ? 'row' : 'column', gap: '4px', alignItems: compact ? 'center' : 'stretch' }}>
      <label
        htmlFor={`sim-range-${paramKey}`}
        style={{ fontSize: '13px', color: 'var(--sim-text-muted)', minWidth: compact ? '60px' : undefined }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <input
          id={`sim-range-${paramKey}`}
          type="range"
          role="slider"
          aria-label={label}
          min={def.min}
          max={def.max}
          step={step}
          value={value}
          onChange={(e) => setParameter(paramKey, Number(e.target.value))}
          style={{
            flex: 1,
            appearance: 'none',
            WebkitAppearance: 'none',
            height: '4px',
            background: `linear-gradient(to right, var(--sim-accent) ${pct}%, var(--sim-border) ${pct}%)`,
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: '12px', fontFamily: 'var(--sim-font-mono)', minWidth: '30px', textAlign: 'right' }}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ---- Toggle Control ----

function ToggleControl({
  paramKey,
  def,
  value,
  compact,
  setParameter,
}: {
  paramKey: string;
  def: Extract<ParameterDef, { type: 'toggle' }>;
  value: boolean;
  compact: boolean | undefined;
  setParameter: (key: string, value: ParameterValue) => void;
}) {
  const label = def.label ?? paramKey;

  return (
    <div style={{ display: 'flex', flexDirection: compact ? 'row' : 'column', gap: '4px', alignItems: compact ? 'center' : 'stretch' }}>
      <span style={{ fontSize: '13px', color: 'var(--sim-text-muted)', minWidth: compact ? '60px' : undefined }}>
        {label}
      </span>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => setParameter(paramKey, !value)}
        style={{
          position: 'relative',
          width: '40px',
          height: '22px',
          borderRadius: '11px',
          background: value ? 'var(--sim-accent)' : 'var(--sim-border)',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.15s',
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '3px',
            left: value ? '21px' : '3px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.15s',
          }}
        />
      </button>
    </div>
  );
}

// ---- Select Control ----

function SelectControl({
  paramKey,
  def,
  value,
  compact,
  setParameter,
}: {
  paramKey: string;
  def: Extract<ParameterDef, { type: 'select' }>;
  value: string;
  compact: boolean | undefined;
  setParameter: (key: string, value: ParameterValue) => void;
}) {
  const label = def.label ?? paramKey;

  return (
    <div style={{ display: 'flex', flexDirection: compact ? 'row' : 'column', gap: '4px', alignItems: compact ? 'center' : 'stretch' }}>
      <label
        htmlFor={`sim-select-${paramKey}`}
        style={{ fontSize: '13px', color: 'var(--sim-text-muted)', minWidth: compact ? '60px' : undefined }}
      >
        {label}
      </label>
      <select
        id={`sim-select-${paramKey}`}
        aria-label={label}
        value={value}
        onChange={(e) => setParameter(paramKey, e.target.value)}
        style={{
          background: 'var(--sim-surface)',
          border: '1px solid var(--sim-border)',
          color: 'var(--sim-text)',
          borderRadius: 'var(--sim-radius-sm)',
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        {def.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// ---- Color Control ----

function ColorControl({
  paramKey,
  def,
  value,
  compact,
  setParameter,
}: {
  paramKey: string;
  def: Extract<ParameterDef, { type: 'color' }>;
  value: string;
  compact: boolean | undefined;
  setParameter: (key: string, value: ParameterValue) => void;
}) {
  const label = def.label ?? paramKey;

  return (
    <div style={{ display: 'flex', flexDirection: compact ? 'row' : 'column', gap: '4px', alignItems: compact ? 'center' : 'stretch' }}>
      <span style={{ fontSize: '13px', color: 'var(--sim-text-muted)', minWidth: compact ? '60px' : undefined }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            background: value,
            borderRadius: 'var(--sim-radius-sm)',
            border: '1px solid var(--sim-border)',
          }}
        />
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => setParameter(paramKey, e.target.value)}
          style={{ cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}

// ---- Vec2 Control ----

function Vec2Control({
  paramKey,
  def,
  value,
  compact,
  setParameter,
}: {
  paramKey: string;
  def: Extract<ParameterDef, { type: 'vec2' }>;
  value: [number, number];
  compact: boolean | undefined;
  setParameter: (key: string, value: ParameterValue) => void;
}) {
  const label = def.label ?? paramKey;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '13px', color: 'var(--sim-text-muted)' }}>
        {label}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: compact ? 0 : '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--sim-font-mono)', width: '12px' }}>X</span>
          <input
            type="range"
            role="slider"
            aria-label="X"
            min={def.min}
            max={def.max}
            value={value[0]}
            onChange={(e) => setParameter(paramKey, [Number(e.target.value), value[1]])}
            style={{ flex: 1, appearance: 'none', WebkitAppearance: 'none', height: '4px', borderRadius: '2px', background: 'var(--sim-border)', cursor: 'pointer' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--sim-font-mono)', width: '12px' }}>Y</span>
          <input
            type="range"
            role="slider"
            aria-label="Y"
            min={def.min}
            max={def.max}
            value={value[1]}
            onChange={(e) => setParameter(paramKey, [value[0], Number(e.target.value)])}
            style={{ flex: 1, appearance: 'none', WebkitAppearance: 'none', height: '4px', borderRadius: '2px', background: 'var(--sim-border)', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
}

// ---- Group Control (collapsible) ----

function GroupControl({
  def,
  compact,
  setParameter,
}: {
  def: Extract<ParameterDef, { type: 'group' }>;
  compact: boolean | undefined;
  setParameter: (key: string, value: ParameterValue) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setMeasuredHeight(contentRef.current.scrollHeight);
    }
  });

  // Read parameters inside the group via hook at this level
  const parameters = useParameters();

  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'transparent',
          border: 'none',
          color: 'var(--sim-text)',
          cursor: 'pointer',
          padding: '4px 0',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <span style={{ fontSize: '10px', width: '12px' }}>{expanded ? '\u25BE' : '\u25B8'}</span>
        {def.label}
      </button>
      <div
        ref={contentRef}
        style={{
          overflow: 'hidden',
          transition: 'height 0.2s ease',
          height: expanded ? (measuredHeight > 0 ? `${measuredHeight}px` : 'auto') : '0px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '12px', paddingLeft: '16px', paddingTop: '4px' }}>
          {Object.entries(def.children).map(([childKey, childDef]) => (
            <ControlField
              key={childKey}
              paramKey={childKey}
              def={childDef}
              value={parameters[childKey]}
              compact={compact}
              setParameter={setParameter}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
