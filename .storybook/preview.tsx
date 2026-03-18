import type { Preview } from '@storybook/react';
import { simKitTheme } from './sim-kit-theme';
import '../src/theme/index.css';

const preview: Preview = {
  parameters: {
    docs: { theme: simKitTheme },
    backgrounds: { disable: true },
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--sim-bg)', minHeight: '100vh', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
