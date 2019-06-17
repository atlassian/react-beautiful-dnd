/* eslint-disable flowtype/require-valid-file-annotation */

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import strip from 'rollup-plugin-strip';
import { uglify } from 'rollup-plugin-uglify';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';
import json from 'rollup-plugin-json';
import pkg from './package.json';

const input = './src/index.js';
const extensions = ['.js', '.jsx'];

// Treat as externals all not relative and not absolute paths
// e.g. 'react'
const excludeAllExternals = id => !id.startsWith('.') && !id.startsWith('/');

const getBabelOptions = ({ useESModules }) => ({
  exclude: 'node_modules/**',
  runtimeHelpers: true,
  plugins: [['@babel/transform-runtime', { corejs: 3, useESModules }]],
});

const snapshotArgs =
  process.env.SNAPSHOT === 'match'
    ? {
        matchSnapshot: true,
        threshold: 1000,
      }
    : {};

const commonjsArgs = {
  include: 'node_modules/**',
  // needed for react-is via react-redux
  // https://stackoverflow.com/questions/50080893/rollup-error-isvalidelementtype-is-not-exported-by-node-modules-react-is-inde/50098540
  namedExports: {
    'node_modules/react-redux/node_modules/react-is/index.js': [
      'isValidElementType',
      'isContextConsumer',
    ],
  },
};

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
      globals: { react: 'React', 'react-dom': 'ReactDOM' },
    },
    // Only deep dependency required is React
    external: ['react', 'react-dom'],
    plugins: [
      json(),
      babel(getBabelOptions({ useESModules: true })),
      resolve({ extensions }),
      commonjs(commonjsArgs),
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
      globals: { react: 'React', 'react-dom': 'ReactDOM' },
    },
    // Only deep dependency required is React
    external: ['react', 'react-dom'],
    plugins: [
      json(),
      babel(getBabelOptions({ useESModules: true })),
      resolve({ extensions }),
      commonjs(commonjsArgs),
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
      json(),
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
      json(),
      resolve({ extensions }),
      babel(getBabelOptions({ useESModules: true })),
      sizeSnapshot(snapshotArgs),
    ],
  },
];
