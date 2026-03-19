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
  const providerProps = {
    tickFn: identityTick,
    initialEntities: initialEntities ?? { value: 42 },
    ...(parameters !== undefined ? { parameters } : {}),
  };
  return (
    <SimulationProvider {...providerProps}>
      {children}
    </SimulationProvider>
  );
}
