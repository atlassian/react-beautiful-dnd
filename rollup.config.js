import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import yargs from 'yargs';

const args = yargs.argv;

export default {
  input: './lib/index.js',
  output: {
    file: `dist/react-beautiful-dnd${args.min ? '.min' : ''}.js`,
    format: 'umd',
  },
  name: 'ReactBeautifulDnd',
  plugins: [
    babel({ exclude: 'node_modules/**', babelrc: false }),
    resolve(),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ].concat(
    args.min ? uglify() : []
  ),
  sourceMap: false,
  external: ['react'],
  globals: { react: 'React' },
};
