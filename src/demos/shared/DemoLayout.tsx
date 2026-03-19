import type { ReactNode } from 'react';

export interface DemoLayoutProps {
  title: string;
  renderer: ReactNode;
  sidebar: ReactNode;
  bottom: ReactNode;
  timeline?: ReactNode;
}

/**
 * Shared layout for all sim-kit demos.
 * CSS Grid: renderer left/center, controls sidebar right, data panels bottom.
 * All colors from --sim-* custom properties for consistent theming.
 */
export function DemoLayout({ title, renderer, sidebar, bottom, timeline }: DemoLayoutProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gridTemplateRows: 'auto 1fr auto auto',
        height: '100vh',
        background: 'var(--sim-bg)',
        color: 'var(--sim-text)',
        fontFamily: 'var(--sim-font-family)',
      }}
    >
      <header
        style={{
          gridColumn: '1 / -1',
          padding: '12px 16px',
          borderBottom: '1px solid var(--sim-border)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18 }}>{title}</h1>
      </header>

      <main style={{ overflow: 'hidden', position: 'relative' }}>
        {renderer}
      </main>

      <aside
        style={{
          padding: 16,
          borderLeft: '1px solid var(--sim-border)',
          overflowY: 'auto',
        }}
      >
        {sidebar}
      </aside>

      {timeline && (
        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--sim-border)' }}>
          {timeline}
        </div>
      )}

      <footer
        style={{
          gridColumn: '1 / -1',
          borderTop: timeline ? undefined : '1px solid var(--sim-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: 16,
            overflowX: 'auto',
          }}
        >
          {bottom}
        </div>
      </footer>
    </div>
  );
}
