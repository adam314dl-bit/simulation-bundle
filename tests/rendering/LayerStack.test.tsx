import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LayerStack } from '../../src/rendering/LayerStack';

describe('LayerStack', () => {
  it('renders children', () => {
    render(
      <LayerStack>
        <div data-testid="child">Hello</div>
      </LayerStack>,
    );
    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('container div has position: relative', () => {
    const { container } = render(
      <LayerStack>
        <span>content</span>
      </LayerStack>,
    );
    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper.style.position).toBe('relative');
  });

  it('does not render SVG overlay when selectionMode is none (default)', () => {
    const { container } = render(
      <LayerStack>
        <span>content</span>
      </LayerStack>,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders SVG overlay when selectionMode is rect', () => {
    const { container } = render(
      <LayerStack selectionMode="rect">
        <span>content</span>
      </LayerStack>,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders SVG overlay when selectionMode is lasso', () => {
    const { container } = render(
      <LayerStack selectionMode="lasso">
        <span>content</span>
      </LayerStack>,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('SVG overlay has pointer-events: all', () => {
    const { container } = render(
      <LayerStack selectionMode="rect">
        <span>content</span>
      </LayerStack>,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.style.pointerEvents).toBe('all');
  });

  it('children render in DOM order (z-ordering)', () => {
    const { container } = render(
      <LayerStack>
        <div data-testid="bottom">Bottom</div>
        <div data-testid="top">Top</div>
      </LayerStack>,
    );
    const wrapper = container.firstElementChild as HTMLDivElement;
    const children = Array.from(wrapper.children);
    expect((children[0] as HTMLElement).dataset.testid).toBe('bottom');
    expect((children[1] as HTMLElement).dataset.testid).toBe('top');
  });

  it('forwards className prop to container div', () => {
    const { container } = render(
      <LayerStack className="my-custom-class">
        <span>content</span>
      </LayerStack>,
    );
    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper.classList.contains('my-custom-class')).toBe(true);
  });

  it('SVG overlay has zIndex 9999 (topmost)', () => {
    const { container } = render(
      <LayerStack selectionMode="rect">
        <span>content</span>
      </LayerStack>,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.style.zIndex).toBe('9999');
  });

  it('container has overflow: hidden', () => {
    const { container } = render(
      <LayerStack>
        <span>content</span>
      </LayerStack>,
    );
    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper.style.overflow).toBe('hidden');
  });
});
