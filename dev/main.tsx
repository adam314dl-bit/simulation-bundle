import { StrictMode, Suspense, lazy, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/theme/index.css';

// Lazy-load demo modules (pathname-based routing -- no React Router)
const demos: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  '/': () => import('../src/demos/ecosystem').then((m) => ({ default: m.EcosystemDemo })),
  '/ecosystem': () => import('../src/demos/ecosystem').then((m) => ({ default: m.EcosystemDemo })),
  '/particles': () => import('../src/demos/particles').then((m) => ({ default: m.ParticlesDemo })),
  '/network': () => import('../src/demos/network').then((m) => ({ default: m.NetworkDemo })),
};

function Nav() {
  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 24,
        background: 'var(--sim-bg)',
        color: 'var(--sim-text)',
        fontFamily: 'var(--sim-font-family)',
      }}
    >
      <h1 style={{ fontSize: 24, margin: 0 }}>sim-kit demos</h1>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: 16 }}>
        <li><a href="/ecosystem" style={{ color: 'var(--sim-accent)' }}>Ecosystem</a></li>
        <li><a href="/particles" style={{ color: 'var(--sim-accent)' }}>Particles</a></li>
        <li><a href="/network" style={{ color: 'var(--sim-accent)' }}>Network</a></li>
      </ul>
    </nav>
  );
}

function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const loader = demos[pathname];
  if (!loader) {
    return <Nav />;
  }

  const LazyDemo = lazy(loader);

  return (
    <Suspense fallback={<div style={{ color: 'var(--sim-text)', padding: 32 }}>Loading...</div>}>
      <LazyDemo />
    </Suspense>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
