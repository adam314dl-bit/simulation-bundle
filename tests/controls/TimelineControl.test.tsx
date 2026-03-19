import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SimulationProvider } from 'sim-kit/core';

import { TimelineControl } from 'sim-kit/controls';

function renderTimeline(props: { enableShortcuts?: boolean } = {}) {
  return render(
    <SimulationProvider tickFn={(e: unknown) => e} initialEntities={{ v: 0 }}>
      <TimelineControl {...props} />
    </SimulationProvider>
  );
}

describe('CTRL-03: scrubber, transport, speed, keyframes, FPS', () => {
  it('renders play/pause button', () => {
    renderTimeline();
    expect(
      screen.getByLabelText('Play') || screen.getByLabelText('Pause')
    ).toBeInTheDocument();
  });

  it('renders step-back and step-forward buttons', () => {
    renderTimeline();
    expect(screen.getByLabelText('Step back')).toBeInTheDocument();
    expect(screen.getByLabelText('Step forward')).toBeInTheDocument();
  });

  it('renders tick counter in 0/0 format', () => {
    renderTimeline();
    expect(screen.getByText(/\d+\s*\/\s*\d+/)).toBeInTheDocument();
  });

  it('renders speed badge with current speed', () => {
    renderTimeline();
    expect(screen.getByText('1x')).toBeInTheDocument();
  });

  it('renders scrubber track', () => {
    renderTimeline();
    expect(screen.getByTestId('scrubber-track')).toBeInTheDocument();
  });

  it('speed badge cycles on click', () => {
    renderTimeline();
    const badge = screen.getByText('1x');
    fireEvent.click(badge);
    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  it('speed badge cycles backward on Shift+click', () => {
    renderTimeline();
    const badge = screen.getByText('1x');
    fireEvent.click(badge, { shiftKey: true });
    expect(screen.getByText('0.5x')).toBeInTheDocument();
  });
});

describe('CTRL-04: keyboard shortcuts', () => {
  it('Space toggles play/pause', () => {
    renderTimeline();
    expect(screen.getByLabelText('Play')).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: ' ' });
    });

    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });

  it('ArrowRight steps forward', () => {
    renderTimeline();
    const stepBtn = screen.getByLabelText('Step forward');
    act(() => { fireEvent.click(stepBtn); });
    act(() => { fireEvent.click(stepBtn); });
    act(() => { fireEvent.click(stepBtn); });

    expect(screen.getByText(/3\s*\/\s*\d+/)).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    });

    expect(screen.getByText(/4\s*\/\s*\d+/)).toBeInTheDocument();
  });

  it('ArrowLeft steps back', () => {
    renderTimeline();
    const stepBtn = screen.getByLabelText('Step forward');
    act(() => { fireEvent.click(stepBtn); });
    act(() => { fireEvent.click(stepBtn); });

    expect(screen.getByText(/2\s*\/\s*\d+/)).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
    });

    expect(screen.getByText(/1\s*\/\s*\d+/)).toBeInTheDocument();
  });

  it('Shift+ArrowRight seeks +10 ticks', () => {
    renderTimeline();
    const stepBtn = screen.getByLabelText('Step forward');
    for (let i = 0; i < 20; i++) {
      act(() => { fireEvent.click(stepBtn); });
    }

    // Step back to tick 5 using stepBack button
    const stepBackBtn = screen.getByLabelText('Step back');
    for (let i = 0; i < 15; i++) {
      act(() => { fireEvent.click(stepBackBtn); });
    }

    expect(screen.getByText(/5\s*\/\s*\d+/)).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowRight', shiftKey: true });
    });

    expect(screen.getByText(/15\s*\/\s*\d+/)).toBeInTheDocument();
  });

  it('ignores shortcuts when focus is in input', () => {
    renderTimeline();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    expect(screen.getByLabelText('Play')).toBeInTheDocument();

    // Dispatch a native KeyboardEvent from the focused input
    act(() => {
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      input.dispatchEvent(event);
    });

    expect(screen.getByLabelText('Play')).toBeInTheDocument();

    document.body.removeChild(input);
  });

  it('disables shortcuts via enableShortcuts={false}', () => {
    renderTimeline({ enableShortcuts: false });

    expect(screen.getByLabelText('Play')).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: ' ' });
    });

    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });
});
