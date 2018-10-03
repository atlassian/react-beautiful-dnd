// @flow
import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';
import { getBabelOptions, extensions } from '../../../rollup.config';

const getCode = async ({ mode }): Promise<string> => {
  const plugins = [
    replace({ 'process.env.NODE_ENV': JSON.stringify(mode) }),
    babel(getBabelOptions({ useESModules: true })),
    resolve({ extensions }),
    commonjs({ include: 'node_modules/**' }),
  ];
  if (mode === 'production') {
    // not mangling so we can be sure we are matching in tests
    plugins.push(uglify({ mangle: false }));
  }

  const inputOptions = {
    input: './src/index.js',
    external: ['react'],
    plugins,
  };
  const outputOptions = {
    format: 'umd',
    name: 'ReactBeautifulDnd',
    globals: { react: 'React' },
  };
  const bundle = await rollup(inputOptions);
  const { code } = await bundle.generate(outputOptions);
  return code;
};

it('should contain warnings in development', async () => {
  const code: string = await getCode({ mode: 'development' });
  expect(code.includes('This is a development only message')).toBe(true);
});

it('should not contain warnings in production', async () => {
  const code: string = await getCode({ mode: 'production' });
  expect(code.includes('This is a development only message')).toBe(false);
  expect(code.includes('console.warn')).toBe(false);
  expect(code.includes('console.error')).toBe(false);
});
