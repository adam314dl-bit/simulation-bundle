import { SimulationProvider } from '../../src/core';
import type { ParameterSchema } from '../../src/types';
import type { ReactNode } from 'react';

interface MockProps {
  children: ReactNode;
  initialEntities?: unknown;
  parameters?: ParameterSchema;
  autoPlay?: boolean;
}

const identityTick = (e: unknown) => e;

export function MockSimulationProvider({ children, initialEntities, parameters }: MockProps) {
  return (
    <SimulationProvider tickFn={identityTick} initialEntities={initialEntities ?? { value: 42 }} parameters={parameters}>
      {children}
    </SimulationProvider>
  );
}
