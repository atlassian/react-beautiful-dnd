/* eslint-disable flowtype/require-valid-file-annotation */

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import strip from 'rollup-plugin-strip';
import { uglify } from 'rollup-plugin-uglify';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';
import pkg from './package.json';

const input = './src/index.js';
const extensions = ['.js', '.jsx'];

// Treat as externals all not relative and not absolute paths
// e.g. 'react'
const excludeAllExternals = id => !id.startsWith('.') && !id.startsWith('/');

const getBabelOptions = () => ({
  exclude: 'node_modules/**',
  runtimeHelpers: true,
});

const matchSnapshot = process.env.SNAPSHOT === 'match';

export default [
  // Universal module definition (UMD) build
  // - including console.* statements
  // - conditionally used to match snapshot size
  {
    input,
    output: {
      file: 'dist/react-beautiful-dnd.js',
      format: 'umd',
      name: 'ReactBeautifulDnd',
      globals: { react: 'React' },
    },
    // Only deep dependency required is React
    external: ['react'],
    plugins: [
      babel(getBabelOptions()),
      resolve({ extensions }),
      commonjs({ include: 'node_modules/**' }),
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
      sizeSnapshot({ matchSnapshot }),
    ],
  },
  // Minified UMD build
  {
    input,
    output: {
      file: 'dist/react-beautiful-dnd.min.js',
      format: 'umd',
      name: 'ReactBeautifulDnd',
      globals: { react: 'React' },
    },
    // Only deep dependency required is React
    external: ['react'],
    plugins: [
      // Setting production env before running babel etc
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      babel(getBabelOptions()),
      resolve({ extensions }),
      commonjs({ include: 'node_modules/**' }),
      strip({ debugger: true }),
      sizeSnapshot({ matchSnapshot }),
      uglify(),
    ],
  },
  // CommonJS (cjs) build
  // - Keeping console.log statements
  // - All external packages are not bundled
  {
    input,
    output: { file: pkg.main, format: 'cjs' },
    external: excludeAllExternals,
    plugins: [resolve({ extensions }), babel(getBabelOptions())],
  },
  // EcmaScript Module (esm) build
  // - Keeping console.log statements
  // - All external packages are not bundled
  {
    input,
    output: { file: pkg.module, format: 'es' },
    external: excludeAllExternals,
    plugins: [
      resolve({ extensions }),
      babel(getBabelOptions()),
      sizeSnapshot({ matchSnapshot }),
    ],
  },
];
