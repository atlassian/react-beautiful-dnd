module.exports = {
  extends: [
    'prettier',
    'eslint:recommended',
    'plugin:flowtype/recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/errors',
    'plugin:jest/recommended',
    'prettier/flowtype',
    'prettier/react',
    'plugin:prettier/recommended',
  ],
  parser: 'babel-eslint',
  plugins: ['react', 'jsx-a11y', 'import', 'jest', 'flowtype', 'prettier'],
  env: {
    es6: true,
    browser: true,
    node: true,
    'jest/globals': true,
  },
  globals: {
    // flow globals
    TimeoutID: true,
    IntervalID: true,
    AnimationFrameID: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx'],
      },
    },
  },
  rules: {
    // Allowing warning and error console logging
    'no-console': ['error', { allow: ['warn', 'error'] }],

    // Require // @flow at the top of files
    'flowtype/require-valid-file-annotation': [
      'error',
      'always',
      { annotationStyle: 'line' },
    ],

    // Allowing importing from dev deps (for stories and tests)
    'import/no-extraneous-dependencies': 'off',

    // Require a newline after the last import/require in a group
    'import/newline-after-import': 'error',

    // ensure absolute imports are above relative imports and that unassigned imports are ignored
    'import/order': [
      'error',
      { groups: [['builtin', 'external', 'internal']] },
    ],
    // allow import * from
    'import/namespace': 'off',
  },
};
