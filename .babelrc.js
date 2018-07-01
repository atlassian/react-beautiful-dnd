module.exports = {
  presets: [
    '@babel/react',
    '@babel/flow',
    ['@babel/env', { modules: false, loose: true }],
  ],
  plugins: [
    ['@babel/proposal-class-properties', { loose: true }],
    ['@babel/proposal-object-rest-spread', { loose: true }],
    'dev-expression'
  ],
  comments: false,
};

if (process.env.NODE_ENV === 'test') {
  module.exports.plugins.push('@babel/transform-modules-commonjs');
}
