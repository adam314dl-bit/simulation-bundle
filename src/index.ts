// sim-kit root barrel — re-exports all layers for convenient prototyping
// For production tree-shaking, import from subpaths: 'sim-kit/core', 'sim-kit/rendering', etc.
export * from './core/index';
export * from './rendering/index';
export * from './controls/index';
export * from './data/index';
// demos intentionally NOT re-exported from root — demos/ is the $49 tier
