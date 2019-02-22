/* eslint-disable flowtype/require-valid-file-annotation */

module.exports = {
  setupFiles: ['./test/env-setup.js'],
  setupTestFrameworkScriptFile: './test/test-setup.js',
  // node_modules is default.
  testPathIgnorePatterns: ['/node_modules/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
