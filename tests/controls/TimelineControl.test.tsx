import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SimulationProvider } from 'sim-kit/core';

// Will be exported from sim-kit/controls once implemented
import { TimelineControl } from 'sim-kit/controls';

function renderTimeline(props: { enableShortcuts?: boolean } = {}) {
  return render(
    <SimulationProvider tickFn={(e: unknown) => e}>
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
    // Initially shows Play (not running)
    expect(screen.getByLabelText('Play')).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: ' ' });
    });

    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });

  it('ArrowRight steps forward', () => {
    renderTimeline();
    // Step forward a few times first to build history
    const stepBtn = screen.getByLabelText('Step forward');
    act(() => { fireEvent.click(stepBtn); });
    act(() => { fireEvent.click(stepBtn); });
    act(() => { fireEvent.click(stepBtn); });

    // Tick should be 3 now
    expect(screen.getByText(/3\s*\/\s*\d+/)).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    });

    // Should be 4 now
    expect(screen.getByText(/4\s*\/\s*\d+/)).toBeInTheDocument();
  });

  it('ArrowLeft steps back', () => {
    renderTimeline();
    const stepBtn = screen.getByLabelText('Step forward');
    act(() => { fireEvent.click(stepBtn); });
    act(() => { fireEvent.click(stepBtn); });

    // Tick should be 2
    expect(screen.getByText(/2\s*\/\s*\d+/)).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
    });

    // Should be 1 now
    expect(screen.getByText(/1\s*\/\s*\d+/)).toBeInTheDocument();
  });

  it('Shift+ArrowRight seeks +10 ticks', () => {
    renderTimeline();
    const stepBtn = screen.getByLabelText('Step forward');
    // Step forward 20 times to build history
    for (let i = 0; i < 20; i++) {
      act(() => { fireEvent.click(stepBtn); });
    }

    // Now at tick 20, step back to tick 5 via ArrowLeft
    for (let i = 0; i < 15; i++) {
      act(() => {
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
      });
    }

    // Should be at tick 5
    expect(screen.getByText(/5\s*\/\s*\d+/)).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowRight', shiftKey: true });
    });

    // Should be at tick 15
    expect(screen.getByText(/15\s*\/\s*\d+/)).toBeInTheDocument();
  });

  it('ignores shortcuts when focus is in input', () => {
    const { container } = renderTimeline();
    // Add an input element and focus it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // Confirm initial state
    expect(screen.getByLabelText('Play')).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: ' ', target: input });
    });

    // Should still be Play (not toggled)
    expect(screen.getByLabelText('Play')).toBeInTheDocument();

    document.body.removeChild(input);
  });

  it('disables shortcuts via enableShortcuts={false}', () => {
    renderTimeline({ enableShortcuts: false });

    expect(screen.getByLabelText('Play')).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: ' ' });
    });

    // Should still be Play (shortcuts disabled)
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });
});
