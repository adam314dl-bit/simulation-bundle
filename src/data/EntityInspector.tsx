import { useRef } from 'react';
import type { EntityInspectorProps } from './types';

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  right: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 280,
    height: '100%',
    borderLeft: '1px solid var(--sim-border, #2a2a3a)',
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 200,
    borderTop: '1px solid var(--sim-border, #2a2a3a)',
  },
  floating: {
    position: 'fixed',
    width: 300,
    minHeight: 100,
    borderRadius: 'var(--sim-radius-md, 8px)',
    border: '1px solid var(--sim-border, #2a2a3a)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
};

function buildSparklinePoints(data: number[], width: number, height: number): string {
  if (data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  return data
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(' ');
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') return value.toFixed(2);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export function EntityInspector({
  entity,
  title,
  position = 'right',
  onTrack,
  tracked = false,
  chartKeys,
  chartData,
  className,
}: EntityInspectorProps): React.JSX.Element {
  const posRef = useRef({ x: 100, y: 100 });
  const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const isFloating = position === 'floating';

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = {
      x: e.clientX, y: e.clientY,
      ox: posRef.current.x, oy: posRef.current.y,
    };
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).hasPointerCapture(e.pointerId)) return;
    posRef.current = {
      x: dragStartRef.current.ox + (e.clientX - dragStartRef.current.x),
      y: dragStartRef.current.oy + (e.clientY - dragStartRef.current.y),
    };
    if (panelRef.current) {
      panelRef.current.style.transform =
        `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const panelStyle: React.CSSProperties = {
    ...POSITION_STYLES[position],
    background: 'var(--sim-surface, #141420)',
    overflowY: 'auto',
    fontFamily: 'var(--sim-font-family)',
    padding: 'calc(var(--sim-spacing, 4px) * 3)',
    ...(isFloating ? { transform: `translate(${posRef.current.x}px, ${posRef.current.y}px)` } : {}),
  };

  return (
    <div
      ref={panelRef}
      data-testid="entity-inspector"
      className={className}
      style={panelStyle}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'calc(var(--sim-spacing, 4px) * 2)',
          ...(isFloating ? { cursor: 'grab', touchAction: 'none' } : {}),
        }}
        {...(isFloating
          ? {
              'data-testid': 'drag-handle',
              onPointerDown,
              onPointerMove,
              onPointerUp,
            }
          : {})}
      >
        <div
          style={{
            color: 'var(--sim-text, #e8e8ed)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {title ?? 'Inspector'}
        </div>
        <button
          data-testid="track-toggle"
          onClick={() => onTrack?.(!tracked)}
          style={{
            background: tracked ? 'var(--sim-accent, #6366f1)' : 'var(--sim-surface-raised, #1e1e2e)',
            color: 'var(--sim-text, #e8e8ed)',
            border: '1px solid var(--sim-border, #2a2a3a)',
            borderRadius: 'var(--sim-radius-sm, 4px)',
            padding: '2px 8px',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          {tracked ? 'Tracking' : 'Track'}
        </button>
      </div>

      {/* Property list */}
      {Object.entries(entity).map(([key, value]) => (
        <div key={key}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              borderBottom: '1px solid var(--sim-border, #2a2a3a)',
            }}
          >
            <span
              style={{
                color: 'var(--sim-text-muted, #8888a0)',
                fontSize: 12,
              }}
            >
              {key}
            </span>
            <span
              style={{
                color: typeof value === 'boolean'
                  ? (value ? 'var(--sim-success, #22c55e)' : 'var(--sim-danger, #ef4444)')
                  : 'var(--sim-text, #e8e8ed)',
                fontFamily: typeof value === 'number' ? 'var(--sim-font-mono)' : undefined,
                fontSize: 12,
              }}
            >
              {formatValue(value)}
            </span>
          </div>
          {chartKeys?.includes(key) && chartData?.[key] && (
            <div data-testid={`chart-${key}`} style={{ padding: '4px 0' }}>
              <svg width={120} height={40}>
                <polyline
                  points={buildSparklinePoints(chartData[key]!, 120, 40)}
                  fill="none"
                  stroke="var(--sim-accent, #6366f1)"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
