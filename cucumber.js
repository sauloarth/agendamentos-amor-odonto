const common = {
  paths: ['features/**/*.feature'],
  require: ['features/support/**/*.ts', 'features/step_definitions/**/*.ts'],
  requireModule: ['tsx/cjs'],
  format: ['progress-bar', 'summary'],
};

module.exports = {
  default: { ...common, tags: 'not @known-bug' },
  // Scenarios documenting bugs not fixed yet: npx cucumber-js --profile known-bugs
  'known-bugs': { ...common, tags: '@known-bug', forceExit: true },
};
