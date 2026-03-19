import { useState, useRef, useEffect, useCallback } from 'react';
import { useSimulation } from '../core/useSimulation';
import type { SimEvent } from '../types/index';
import type { EventLogProps } from './types';

const SEVERITY_COLORS: Record<string, string> = {
  info: 'var(--sim-info, #60a5fa)',
  warning: 'var(--sim-warning, #fbbf24)',
  critical: 'var(--sim-critical, #f87171)',
};

const SEVERITY_ICONS: Record<string, string> = {
  info: 'i',
  warning: '!',
  critical: 'X',
};

const SEVERITY_LABELS: Array<'info' | 'warning' | 'critical'> = ['info', 'warning', 'critical'];

export function EventLog({
  maxHeight,
  severityFilter,
  autoScroll = true,
  rowHeight,
  onEventClick,
  className,
}: EventLogProps) {
  const ROW_HEIGHT = rowHeight ?? 32;
  const containerHeight = maxHeight ?? 300;

  const events = useSimulation((s) => s.events);
  const seekToTick = useSimulation((s) => s.seekToTick);

  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(severityFilter ?? SEVERITY_LABELS),
  );
  const [scrollTop, setScrollTop] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledAway = useRef(false);

  const toggleFilter = useCallback((severity: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return next;
    });
  }, []);

  const filteredEvents = events.filter((e) => activeFilters.has(e.severity));

  const visibleStart = Math.floor(scrollTop / ROW_HEIGHT);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + 1;
  const visibleEnd = Math.min(visibleStart + visibleCount, filteredEvents.length);
  const visibleSlice = filteredEvents.slice(visibleStart, visibleEnd);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      setScrollTop(el.scrollTop);
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < ROW_HEIGHT;
      userScrolledAway.current = !atBottom;
    },
    [ROW_HEIGHT],
  );

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (!autoScroll) return;
    if (userScrolledAway.current) return;
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [events.length, autoScroll]);

  const handleRowClick = useCallback(
    (event: SimEvent) => {
      seekToTick(event.tick);
      onEventClick?.(event);
    },
    [seekToTick, onEventClick],
  );

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Severity filter pills */}
      <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Severity filter">
        {SEVERITY_LABELS.map((severity) => {
          const active = activeFilters.has(severity);
          return (
            <button
              key={severity}
              type="button"
              data-testid={`filter-${severity}`}
              onClick={() => toggleFilter(severity)}
              style={{
                background: active ? 'var(--sim-surface-raised)' : 'transparent',
                border: active
                  ? `1px solid ${SEVERITY_COLORS[severity]}`
                  : '1px solid var(--sim-border)',
                borderRadius: 'var(--sim-radius-sm)',
                color: active ? SEVERITY_COLORS[severity] : 'var(--sim-text-muted)',
                padding: '2px 10px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'var(--sim-font-family)',
              }}
            >
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Virtualized event list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        data-testid="event-log-container"
        style={{
          background: 'var(--sim-surface)',
          border: '1px solid var(--sim-border)',
          borderRadius: 'var(--sim-radius-md)',
          overflowY: 'auto',
          maxHeight: containerHeight,
          position: 'relative',
        }}
      >
        {/* Sentinel for scrollbar height */}
        <div
          data-testid="event-log-sentinel"
          style={{ height: filteredEvents.length * ROW_HEIGHT, position: 'relative' }}
        >
          {/* Visible rows */}
          <div style={{ transform: `translateY(${visibleStart * ROW_HEIGHT}px)` }}>
            {visibleSlice.map((event) => (
              <div
                key={event.id}
                data-testid="event-row"
                role="button"
                tabIndex={0}
                onClick={() => handleRowClick(event)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleRowClick(event);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: ROW_HEIGHT,
                  padding: '0 8px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--sim-border)',
                }}
              >
                {/* Severity indicator */}
                <span
                  data-testid={`severity-${event.severity}`}
                  style={{
                    color: SEVERITY_COLORS[event.severity],
                    fontWeight: 'bold',
                    width: 16,
                    textAlign: 'center',
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {SEVERITY_ICONS[event.severity]}
                </span>

                {/* Tick */}
                <span
                  data-testid="event-tick"
                  style={{
                    fontFamily: 'var(--sim-font-mono)',
                    fontSize: 11,
                    color: 'var(--sim-text-muted)',
                    minWidth: 40,
                    flexShrink: 0,
                  }}
                >
                  t{event.tick}
                </span>

                {/* Message */}
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--sim-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                  }}
                >
                  {event.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
