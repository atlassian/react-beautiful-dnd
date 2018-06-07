/* eslint-disable flowtype/require-valid-file-annotation */

module.exports = {
  setupFiles: ['./test/setup.js'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
