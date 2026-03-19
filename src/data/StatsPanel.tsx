import { useMemo } from 'react';
import type { StatsPanelProps, StatConfig } from './types';

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

function ChangeIndicator({ current, sparkline, threshold }: { current: number; sparkline: number[]; threshold: number }) {
  if (sparkline.length < 2) return null;
  const previous = sparkline[sparkline.length - 2] ?? 0;
  if (previous === 0 && current === 0) return null;
  const pctChange = previous === 0 ? (current > 0 ? 100 : -100) : ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pctChange) <= threshold) return null;
  if (pctChange > 0) {
    return <span style={{ color: 'var(--sim-success, #22c55e)', marginLeft: 4, fontSize: 12 }}>&#9650;</span>;
  }
  return <span style={{ color: 'var(--sim-danger, #ef4444)', marginLeft: 4, fontSize: 12 }}>&#9660;</span>;
}

function StatRow({ stat, showChange, changeThreshold }: { stat: StatConfig; showChange: boolean; changeThreshold: number }) {
  const formatter = useMemo(
    () => new Intl.NumberFormat('en-US', stat.format),
    [stat.format]
  );
  const formattedValue = formatter.format(stat.value);
  const sparklinePoints = stat.sparkline ? buildSparklinePoints(stat.sparkline, 60, 20) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sim-spacing, 4px) * 1)' }}>
      <div style={{ color: 'var(--sim-text-muted, #8888a0)', fontFamily: 'var(--sim-font-family)', fontSize: 12 }}>
        {stat.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sim-spacing, 4px) * 1)' }}>
        <span style={{ color: 'var(--sim-text, #e8e8ed)', fontFamily: 'var(--sim-font-mono)', fontSize: 16, fontWeight: 600 }}>
          {formattedValue}
        </span>
        {stat.unit && (
          <span style={{ color: 'var(--sim-text-muted)', fontSize: 12, marginLeft: 2 }}>{stat.unit}</span>
        )}
        {sparklinePoints && (
          <svg width={60} height={20} style={{ marginLeft: 4 }}>
            <polyline
              points={sparklinePoints}
              fill="none"
              stroke="var(--sim-accent, #6366f1)"
              strokeWidth="1.5"
            />
          </svg>
        )}
        {showChange && stat.sparkline && stat.sparkline.length >= 2 && (
          <ChangeIndicator current={stat.value} sparkline={stat.sparkline} threshold={changeThreshold} />
        )}
      </div>
    </div>
  );
}

export function StatsPanel({
  stats,
  columns = 2,
  showChange = true,
  changeThreshold = 0,
  className,
}: StatsPanelProps) {
  return (
    <div
      className={className}
      data-testid="stats-panel"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 'calc(var(--sim-spacing, 4px) * 2)',
        background: 'var(--sim-surface, #141420)',
        borderRadius: 'var(--sim-radius-md, 8px)',
        padding: 'calc(var(--sim-spacing, 4px) * 3)',
        border: '1px solid var(--sim-border, #2a2a3a)',
      }}
    >
      {stats.map((stat) => (
        <StatRow key={stat.label} stat={stat} showChange={showChange} changeThreshold={changeThreshold} />
      ))}
    </div>
  );
}
