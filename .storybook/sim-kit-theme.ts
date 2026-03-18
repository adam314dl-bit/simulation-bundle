import { create } from 'storybook/theming';

export const simKitTheme = create({
  base: 'dark',
  brandTitle: 'sim-kit',
  brandUrl: 'https://example.com',

  colorPrimary: '#6366f1',
  colorSecondary: '#6366f1',

  appBg: '#0a0a0f',
  appContentBg: '#141420',
  appPreviewBg: '#0a0a0f',
  appBorderColor: '#2a2a3a',
  appBorderRadius: 8,

  textColor: '#e8e8ed',
  textInverseColor: '#0a0a0f',

  barTextColor: '#8888a0',
  barSelectedColor: '#6366f1',
  barHoverColor: '#6366f1',
  barBg: '#141420',

  inputBg: '#1e1e2e',
  inputBorder: '#2a2a3a',
  inputTextColor: '#e8e8ed',
  inputBorderRadius: 4,

  fontBase: 'system-ui, -apple-system, sans-serif',
  fontCode: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
});
