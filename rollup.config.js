const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const uglify = require('rollup-plugin-uglify');
const yargs = require('yargs');

const args = yargs.argv;
module.exports = {
  external: ['prop-types', 'react', 'reselect'],
  input: 'src/index.js',
  name: 'ReactBeautifulDnd',
  output: {
    file: `umd/index${args.min ? '.min' : ''}.js`,
    format: 'umd',
  },
  plugins: [
    babel(require('./config/babel.umd')),
    resolve({ extensions: ['.js', '.json', '.jsx'] }),
    commonjs(),
  ].concat(args.min ? uglify() : []),
  sourcemap: true,
};
