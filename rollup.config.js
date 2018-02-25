/* eslint-disable flowtype/require-valid-file-annotation */

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import strip from 'rollup-plugin-strip';

const min = process.env.NODE_ENV === 'min';

export default {
  input: './src/index.js',
  output: {
    file: `dist/react-beautiful-dnd${min ? '.min' : ''}.js`,
    format: 'umd',
    name: 'ReactBeautifulDnd',
    globals: { react: 'React' },
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers'],
    }),
    resolve({
      extensions: ['.js', '.jsx'],
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    strip({
      debugger: true,
    }),
    min ? uglify() : {},
  ],
  external: ['react'],
};
