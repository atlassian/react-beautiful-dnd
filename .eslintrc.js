module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:flowtype/recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
    'prettier/flowtype',
    'prettier/react',
  ],
  parser: 'babel-eslint',
  plugins: ['react', 'jsx-a11y', 'jest', 'flowtype', 'prettier'],
  env: {
    es6: true,
    browser: true,
    node: true,
    'jest/globals': true,
  },
  globals: {
    TimeoutID: true,
    IntervalID: true,
    AnimationFrameID: true,
  },
  rules: {
    'prettier/prettier': 'error',
    // Allowing warning and error console logging
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
};
