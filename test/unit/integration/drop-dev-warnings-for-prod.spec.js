// @flow
import { rollup } from 'rollup';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';
import invariant from 'tiny-invariant';

// 60 second timeout
jest.setTimeout(60 * 1000);

const getCode = async ({ mode }): Promise<string> => {
  const getBabelOptions = ({ useESModules }) => ({
    exclude: 'node_modules/**',
    runtimeHelpers: true,
    plugins: [['@babel/transform-runtime', { corejs: 2, useESModules }]],
  });
  const extensions = ['.js', '.jsx'];
  const plugins = [
    json(),
    replace({ 'process.env.NODE_ENV': JSON.stringify(mode) }),
    babel(getBabelOptions({ useESModules: true })),
    resolve({ extensions }),
    commonjs({
      include: 'node_modules/**',
      // needed for react-is via react-redux v5.1
      // https://stackoverflow.com/questions/50080893/rollup-error-isvalidelementtype-is-not-exported-by-node-modules-react-is-inde/50098540
      namedExports: {
        'node_modules/react-is/index.js': ['isValidElementType'],
      },
    }),
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
  const result = await bundle.generate(outputOptions);
  invariant(result.output.length, 'Failed to generate code');
  return result.output[0].code;
};

it('should contain warnings in development', async () => {
  const code: string = await getCode({ mode: 'development' });
  expect(code.includes('This is a development only message')).toBe(true);
});

it('should not contain warnings in production', async () => {
  const code: string = await getCode({ mode: 'production' });
  expect(code.includes('This is a development only message')).toBe(false);

  // Checking there are no console.* messages
  // Using regex so we can get really nice error messages

  // https://regexr.com/40pno
  // .*? is a lazy match - will grab as little as possible
  const regex: RegExp = /console\.\w+\(.*?\)/g;

  const matches: ?(string[]) = code.match(regex);
  expect(matches).toEqual(null);
});
