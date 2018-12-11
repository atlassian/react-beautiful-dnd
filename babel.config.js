module.exports = {
  presets: ['@babel/react', '@babel/flow', ['@babel/env', { loose: true }]],
  plugins: [
    ['@babel/proposal-class-properties', { loose: true }],
    'styled-components',
    // used for stripping out the `invariant` messages in production builds
    'dev-expression',
  ],
  comments: false,
};
