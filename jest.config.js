/* eslint-disable flowtype/require-valid-file-annotation */

module.exports = {
  setupFiles: ['./test/setup.js'],
  // node_modules is default.
  // We want to ignore any tests in the website(sometimes they are added to / website /.cache)
  testPathIgnorePatterns: ['/node_modules/', '/website/.cache/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
