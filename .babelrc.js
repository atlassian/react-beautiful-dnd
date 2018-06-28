module.exports = {
  presets: [
    '@babel/react',
    '@babel/flow',
    ['@babel/env', { modules: false, loose: true }],
  ],
  plugins: [
    '@babel/transform-runtime',
    ['@babel/proposal-class-properties', { loose: true }],
    '@babel/proposal-object-rest-spread',
  ],
  comments: false,
};

if (process.env.NODE_ENV === 'test') {
  module.exports.plugins.push('@babel/transform-modules-commonjs');
}
