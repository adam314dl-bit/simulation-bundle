import { useContext, useRef, useState, useEffect } from 'react';
import { AreaChart, Area, YAxis } from 'recharts';
import { SimulationContext } from '../core/SimulationProvider';
import type { MiniChartProps } from './types';

interface DataPoint {
  tick: number;
  value: number;
}

export function MiniChart({
  selector,
  windowSize = 60,
  width = 200,
  height = 80,
  color,
  showLastValue = true,
  label,
  className,
}: MiniChartProps) {
  const store = useContext(SimulationContext);
  const dataRef = useRef<DataPoint[]>([]);
  const rafPending = useRef(false);
  const [displayData, setDisplayData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (!store) return;
    const unsub = store.subscribe(() => {
      const state = store.getState();
      const value = selector(state as unknown as Record<string, unknown>);
      dataRef.current = [
        ...dataRef.current.slice(-(windowSize - 1)),
        { tick: state.tick, value },
      ];
      if (!rafPending.current) {
        rafPending.current = true;
        requestAnimationFrame(() => {
          rafPending.current = false;
          setDisplayData([...dataRef.current]);
        });
      }
    });
    return unsub;
  }, [store, selector, windowSize]);

  const strokeColor = color ?? 'var(--sim-accent, #6366f1)';
  const fillColor = color ?? 'var(--sim-accent, #6366f1)';

  return (
    <div
      data-testid="minichart"
      data-window-size={windowSize}
      data-chart-color={color ?? undefined}
      className={className}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        background: 'var(--sim-surface, #141420)',
        borderRadius: 'var(--sim-radius-sm, 4px)',
        border: '1px solid var(--sim-border, #2a2a3a)',
      }}
    >
      {label && (
        <div style={{ position: 'absolute', top: 2, left: 4, fontSize: 10, color: 'var(--sim-text-muted, #8888a0)', zIndex: 1 }}>
          {label}
        </div>
      )}
      <AreaChart
        width={width}
        height={height}
        data={displayData}
        margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
      >
        <YAxis hide domain={['auto', 'auto']} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          fill={fillColor}
          fillOpacity={0.15}
          strokeWidth={1.5}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
      {showLastValue && displayData.length > 0 && (
        <div
          data-testid="minichart-last-value"
          style={{
            position: 'absolute',
            top: 2,
            right: 4,
            fontSize: 11,
            color: 'var(--sim-text, #e8e8ed)',
            fontFamily: 'var(--sim-font-mono)',
            zIndex: 1,
          }}
        >
          {displayData[displayData.length - 1]?.value.toFixed(1)}
        </div>
      )}
    </div>
  );
}
