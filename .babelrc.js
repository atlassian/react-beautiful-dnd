module.exports = {
  presets: [
    '@babel/react',
    '@babel/flow',
    ['@babel/env', { modules: false, loose: true }],
  ],
  plugins: [
    ['@babel/proposal-class-properties', { loose: true }],
    // used for stripping out the `invariant` messages in production builds
    'dev-expression',
  ],
  comments: false,
};

if (process.env.NODE_ENV === 'test') {
  module.exports.plugins.push('@babel/transform-modules-commonjs');
}
