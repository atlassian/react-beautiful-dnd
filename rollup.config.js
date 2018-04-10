/* eslint-disable flowtype/require-valid-file-annotation */

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import strip from 'rollup-plugin-strip';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';

const pkg = require('./package.json');

const input = './src/index.js';

const extensions = ['.js', '.jsx'];

// Treat as externals all not relative and not absolute paths
// e.g. 'react'
const isExternal = id => !id.startsWith('.') && !id.startsWith('/');

const getBabelOptions = () => ({
  exclude: 'node_modules/**',
  runtimeHelpers: true,
});

const checkSnapshot = process.env.SNAPSHOT === 'check';

const getUMDConfig = ({ env, file }) => {
  const config = {
    input,
    output: {
      file,
      format: 'umd',
      name: 'ReactBeautifulDnd',
      globals: { react: 'React' },
    },
    external: ['react'],
    plugins: [
      babel(getBabelOptions()),
      resolve({ extensions }),
      commonjs({ include: 'node_modules/**' }),
      replace({ 'process.env.NODE_ENV': JSON.stringify(env) }),
      strip({ debugger: true }),
      sizeSnapshot({ updateSnapshot: !checkSnapshot }),
    ],
  };

  if (env === 'production') {
    config.plugins.push(uglify());
  }

  return config;
};

export default [
  getUMDConfig({ env: 'development', file: 'dist/react-beautiful-dnd.umd.js' }),

  getUMDConfig({ env: 'production', file: 'dist/react-beautiful-dnd.min.js' }),

  {
    input,
    output: { file: pkg.main, format: 'cjs' },
    external: isExternal,
    plugins: [
      resolve({ extensions }),
      babel(getBabelOptions()),
    ],
  },

  {
    input,
    output: { file: pkg.module, format: 'es' },
    external: isExternal,
    plugins: [
      resolve({ extensions }),
      babel(getBabelOptions()),
      sizeSnapshot({ updateSnapshot: !checkSnapshot }),
    ],
  },
];
