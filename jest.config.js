/* eslint-disable flowtype/require-valid-file-annotation */

module.exports = {
  setupFiles: [
    // for some painful reason this is needed for our 'async' usage
    // in drop-dev-warnings-for-prod.spec.js
    require.resolve('regenerator-runtime/runtime'),
    './test/env-setup.js',
  ],
  setupFilesAfterEnv: ['./test/test-setup.js'],
  // node_modules is default.
  testPathIgnorePatterns: ['/node_modules/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
