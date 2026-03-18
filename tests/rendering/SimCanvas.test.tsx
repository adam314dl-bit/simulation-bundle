import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SimCanvas } from '../../src/rendering/SimCanvas';

// jsdom has limited canvas support — focus on DOM structure, event wiring, prop passing

// Mock requestAnimationFrame/cancelAnimationFrame for controlled testing
vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
  // Call once to verify onDraw is invoked
  setTimeout(() => cb(16), 0);
  return 1;
});
const cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

// Mock getContext to return a minimal context object
const mockCtx = {
  save: vi.fn(),
  restore: vi.fn(),
  setTransform: vi.fn(),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx) as unknown as typeof HTMLCanvasElement.prototype.getContext;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SimCanvas', () => {
  it('renders a canvas element', () => {
    const onDraw = vi.fn();
    const { container } = render(<SimCanvas onDraw={onDraw} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('canvas has touch-action: none style for pointer event handling', () => {
    const onDraw = vi.fn();
    const { container } = render(<SimCanvas onDraw={onDraw} />);
    const canvas = container.querySelector('canvas')!;
    expect(canvas.style.touchAction).toBe('none');
  });

  it('applies default width/height as CSS style', () => {
    const onDraw = vi.fn();
    const { container } = render(<SimCanvas onDraw={onDraw} />);
    const canvas = container.querySelector('canvas')!;
    expect(canvas.style.width).toBe('800px');
    expect(canvas.style.height).toBe('600px');
  });

  it('applies custom width/height as CSS style', () => {
    const onDraw = vi.fn();
    const { container } = render(<SimCanvas onDraw={onDraw} width={400} height={300} />);
    const canvas = container.querySelector('canvas')!;
    expect(canvas.style.width).toBe('400px');
    expect(canvas.style.height).toBe('300px');
  });

  it('passes className prop to canvas element', () => {
    const onDraw = vi.fn();
    const { container } = render(<SimCanvas onDraw={onDraw} className="my-canvas" />);
    const canvas = container.querySelector('canvas')!;
    expect(canvas.classList.contains('my-canvas')).toBe(true);
  });

  it('component unmounts cleanly with cancelAnimationFrame called', () => {
    const onDraw = vi.fn();
    const { unmount } = render(<SimCanvas onDraw={onDraw} />);
    unmount();
    expect(cafSpy).toHaveBeenCalled();
  });

  it('attaches a non-passive wheel listener to the canvas', () => {
    const addEventSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener');
    const onDraw = vi.fn();
    render(<SimCanvas onDraw={onDraw} />);

    const wheelCall = addEventSpy.mock.calls.find(
      (call) => call[0] === 'wheel'
    );
    expect(wheelCall).toBeTruthy();
    // Third argument should contain { passive: false }
    expect(wheelCall![2]).toEqual(expect.objectContaining({ passive: false }));

    addEventSpy.mockRestore();
  });
});
