import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimulationProvider } from 'sim-kit/core';
import { ParameterPanel } from 'sim-kit/controls';
import type { ParameterSchema } from 'sim-kit/types';

const testSchema: ParameterSchema = {
  speed: { type: 'range', min: 0, max: 100, step: 1, default: 50, label: 'Speed' },
  enabled: { type: 'toggle', default: true, label: 'Enabled' },
  mode: { type: 'select', options: ['fast', 'slow', 'normal'], default: 'normal', label: 'Mode' },
  tint: { type: 'color', default: '#ff0000', label: 'Tint' },
  position: { type: 'vec2', min: -10, max: 10, default: [0, 0] as [number, number], label: 'Position' },
  advanced: {
    type: 'group',
    label: 'Advanced',
    children: {
      intensity: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, label: 'Intensity' },
    },
  },
};

function renderWithProvider(ui: React.ReactElement, schema: ParameterSchema = testSchema) {
  return render(
    <SimulationProvider tickFn={(entities: unknown) => entities} parameters={schema}>
      {ui}
    </SimulationProvider>
  );
}

describe('CTRL-01: auto-generates controls from ParameterSchema', () => {
  it('renders a range slider for range params', () => {
    renderWithProvider(<ParameterPanel schema={testSchema} />);
    const slider = screen.getByRole('slider', { name: /speed/i });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
  });

  it('renders numeric display for range params', () => {
    renderWithProvider(<ParameterPanel schema={testSchema} />);
    // The numeric display shows the current value next to the slider
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders a toggle for boolean params', () => {
    renderWithProvider(<ParameterPanel schema={testSchema} />);
    const toggle = screen.getByRole('switch', { name: /enabled/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders a select dropdown for select params', () => {
    renderWithProvider(<ParameterPanel schema={testSchema} />);
    const select = screen.getByRole('combobox', { name: /mode/i });
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
  });

  it('renders a color input for color params', () => {
    renderWithProvider(<ParameterPanel schema={testSchema} />);
    const colorInput = document.querySelector('input[type="color"]') as HTMLInputElement;
    expect(colorInput).not.toBeNull();
    expect(colorInput.value).toBe('#ff0000');
  });

  it('renders vec2 with two range inputs', () => {
    renderWithProvider(<ParameterPanel schema={testSchema} />);
    const xSlider = screen.getByRole('slider', { name: /x/i });
    const ySlider = screen.getByRole('slider', { name: /y/i });
    expect(xSlider).toBeInTheDocument();
    expect(ySlider).toBeInTheDocument();
  });

  it('renders collapsible group with label', () => {
    renderWithProvider(<ParameterPanel schema={testSchema} />);
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    // Nested intensity slider should be visible (groups start expanded)
    expect(screen.getByRole('slider', { name: /intensity/i })).toBeInTheDocument();
  });
});

describe('CTRL-02: layout, compact mode, reset', () => {
  it('resets all parameters to defaults on Reset All click', () => {
    renderWithProvider(<ParameterPanel schema={testSchema} />);
    const slider = screen.getByRole('slider', { name: /speed/i }) as HTMLInputElement;
    // Change value
    fireEvent.change(slider, { target: { value: '75' } });
    expect(slider.value).toBe('75');
    // Click reset
    const resetBtn = screen.getByRole('button', { name: /reset all/i });
    fireEvent.click(resetBtn);
    // Should revert to default
    expect(slider.value).toBe('50');
  });

  it('renders in compact mode with reduced spacing', () => {
    const { container } = renderWithProvider(<ParameterPanel schema={testSchema} compact />);
    const panel = container.querySelector('.sim-panel-compact');
    expect(panel).not.toBeNull();
  });

  it('supports columns={1} and columns={2} override', () => {
    const { container } = renderWithProvider(<ParameterPanel schema={testSchema} columns={2} />);
    const panel = container.querySelector('.sim-panel') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.style.gridTemplateColumns).toContain('repeat(2');
  });
});
