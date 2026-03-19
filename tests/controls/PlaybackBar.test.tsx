import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimulationProvider } from 'sim-kit/core';

import { PlaybackBar } from 'sim-kit/controls';

function renderBar() {
  return render(
    <SimulationProvider tickFn={(e: unknown) => e} initialEntities={{ v: 0 }}>
      <PlaybackBar />
    </SimulationProvider>
  );
}

describe('CTRL-05: minimal playback bar', () => {
  it('renders play/pause button', () => {
    renderBar();
    expect(
      screen.getByLabelText('Play') || screen.getByLabelText('Pause')
    ).toBeInTheDocument();
  });

  it('renders speed badge', () => {
    renderBar();
    expect(screen.getByText('1x')).toBeInTheDocument();
  });

  it('renders tick counter', () => {
    renderBar();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('has 40px max height', () => {
    renderBar();
    const bar = screen.getByTestId('playback-bar');
    expect(bar.style.maxHeight).toBe('40px');
  });

  it('does NOT render step buttons', () => {
    renderBar();
    expect(screen.queryByLabelText('Step back')).toBeNull();
    expect(screen.queryByLabelText('Step forward')).toBeNull();
  });

  it('does NOT render scrubber', () => {
    renderBar();
    expect(screen.queryByTestId('scrubber-track')).toBeNull();
  });

  it('speed badge cycles on click', () => {
    renderBar();
    const badge = screen.getByText('1x');
    fireEvent.click(badge);
    expect(screen.getByText('2x')).toBeInTheDocument();
  });
});
