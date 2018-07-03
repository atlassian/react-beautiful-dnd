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

const getBabelOptions = ({ useESModules }) => ({
  exclude: 'node_modules/**',
  runtimeHelpers: true,
  plugins: [['@babel/transform-runtime', { useESModules }]],
});

const snapshotArgs = (() => {
  const shouldMatch = process.env.SNAPSHOT === 'match';

  if (!shouldMatch) {
    return {};
  }

  return {
    matchSnapshot: true,
    threshold: 1000,
  };
})();

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
      babel(getBabelOptions({ useESModules: true })),
      resolve({ extensions }),
      commonjs({ include: 'node_modules/**' }),
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
      sizeSnapshot(snapshotArgs),
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
      babel(getBabelOptions({ useESModules: true })),
      resolve({ extensions }),
      commonjs({ include: 'node_modules/**' }),
      strip({ debugger: true }),
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      sizeSnapshot(snapshotArgs),
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
    plugins: [
      resolve({ extensions }),
      babel(getBabelOptions({ useESModules: false })),
    ],
  },
  // EcmaScript Module (esm) build
  // - Keeping console.log statements
  // - All external packages are not bundled
  {
    input,
    output: { file: pkg.module, format: 'esm' },
    external: excludeAllExternals,
    plugins: [
      resolve({ extensions }),
      babel(getBabelOptions({ useESModules: true })),
      sizeSnapshot(snapshotArgs),
    ],
  },
];
