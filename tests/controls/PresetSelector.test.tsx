import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimulationProvider, useSimulation } from 'sim-kit/core';
import { PresetSelector } from 'sim-kit/controls';
import type { Preset } from 'sim-kit/controls';
import type { ParameterSchema, ParameterValue } from 'sim-kit/types';

const testPresets: Preset[] = [
  { name: 'Default', config: { speed: 50, enabled: true } },
  { name: 'Fast', config: { speed: 100, enabled: true } },
  { name: 'Disabled', config: { speed: 0, enabled: false }, description: 'All systems off' },
];

const testSchema: ParameterSchema = {
  speed: { type: 'range', min: 0, max: 100, step: 1, default: 50, label: 'Speed' },
  enabled: { type: 'toggle', default: true, label: 'Enabled' },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SimulationProvider
      tickFn={(entities: unknown) => entities}
      parameters={testSchema}
      initialEntities={{ cells: [] }}
    >
      {children}
    </SimulationProvider>
  );
}

/** Helper component that reads parameters and displays them for assertions */
function ParameterCapture() {
  const parameters = useSimulation((s) => s.parameters) as Record<string, ParameterValue>;
  return (
    <div data-testid="params">
      <span data-testid="param-speed">{String(parameters.speed)}</span>
      <span data-testid="param-enabled">{String(parameters.enabled)}</span>
    </div>
  );
}

describe('CTRL-06: preset selector', () => {
  it('renders pills layout by default', () => {
    render(
      <Wrapper>
        <PresetSelector presets={testPresets} />
      </Wrapper>,
    );
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    // Should be buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('highlights active preset with accent', () => {
    render(
      <Wrapper>
        <PresetSelector presets={testPresets} />
      </Wrapper>,
    );
    const fastBtn = screen.getByText('Fast');
    fireEvent.click(fastBtn);
    expect(fastBtn.closest('button')?.getAttribute('data-active')).toBe('true');
  });

  it('applies preset config on click', () => {
    render(
      <Wrapper>
        <PresetSelector presets={testPresets} />
        <ParameterCapture />
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Fast'));
    expect(screen.getByTestId('param-speed').textContent).toBe('100');
    expect(screen.getByTestId('param-enabled').textContent).toBe('true');
  });

  it('supports dropdown variant', () => {
    render(
      <Wrapper>
        <PresetSelector presets={testPresets} variant="dropdown" />
      </Wrapper>,
    );
    const select = document.querySelector('select');
    expect(select).toBeTruthy();
    const options = select!.querySelectorAll('option');
    // Default placeholder + 3 presets = 4
    expect(options.length).toBe(4);
  });

  it('applies preset from dropdown on change', () => {
    render(
      <Wrapper>
        <PresetSelector presets={testPresets} variant="dropdown" />
        <ParameterCapture />
      </Wrapper>,
    );
    const select = document.querySelector('select')!;
    fireEvent.change(select, { target: { value: '1' } });
    expect(screen.getByTestId('param-speed').textContent).toBe('100');
    expect(screen.getByTestId('param-enabled').textContent).toBe('true');
  });

  it('supports cards variant', () => {
    render(
      <Wrapper>
        <PresetSelector presets={testPresets} variant="cards" />
      </Wrapper>,
    );
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('All systems off')).toBeInTheDocument();
  });

  it('pills wrap with flexWrap', () => {
    const { container } = render(
      <Wrapper>
        <PresetSelector presets={testPresets} />
      </Wrapper>,
    );
    const pillContainer = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(pillContainer.style.flexWrap).toBe('wrap');
  });
});
