import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import yargs from 'yargs';

const args = yargs.argv;
const external = ['react'];

export default {
  input: './lib/index.js',
  output: {
    file: `dist/index${args.min ? '.min' : ''}.js`,
    format: 'umd',
  },
  name: 'ReactBeautifulDnd',
  plugins: [babel({ exclude: 'node_modules/**', babelrc: false }), resolve(), commonjs()].concat(
    args.min ? uglify() : []
  ),
  sourceMap: false,
  external,
  globals: { react: 'React' },
};
