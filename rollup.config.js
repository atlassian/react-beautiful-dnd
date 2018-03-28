/* eslint-disable flowtype/require-valid-file-annotation */

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import strip from 'rollup-plugin-strip';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';

const checkSnapshot = process.env.SNAPSHOT === 'check';

const getUMDConfig = ({ env, file }) => {
  const config = {
    input: './src/index.js',
    output: {
      file,
      format: 'umd',
      name: 'ReactBeautifulDnd',
      globals: { react: 'React' },
    },
    plugins: [
      babel({
        exclude: 'node_modules/**',
        runtimeHelpers: true,
      }),
      resolve({
        extensions: ['.js', '.jsx'],
      }),
      commonjs({
        include: 'node_modules/**',
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify(env),
      }),
      strip({
        debugger: true,
      }),
    ],
    external: ['react'],
  };

  if (env === 'development') {
    config.plugins.push(sizeSnapshot({ updateSnapshot: !checkSnapshot }));
  }

  if (env === 'production') {
    config.plugins.push(uglify());
  }

  return config;
};

export default [
  getUMDConfig({ env: 'development', file: 'dist/react-beautiful-dnd.js' }),
  getUMDConfig({ env: 'production', file: 'dist/react-beautiful-dnd.min.js' }),
];
