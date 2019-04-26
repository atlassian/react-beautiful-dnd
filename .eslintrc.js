module.exports = {
  extends: [
    'prettier',
    'airbnb',
    'plugin:flowtype/recommended',
    'prettier/react',
    'prettier/flowtype',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
  ],
  parser: 'babel-eslint',
  plugins: [
    'prettier',
    'flowtype',
    'emotion',
    'react',
    'react-hooks',
    'import',
    'jest',
  ],
  env: {
    es6: true,
    browser: true,
    node: true,
    'jest/globals': true,
  },
  globals: {
    // flow globals
    TimeoutID: true,
    IntervalID: true,
    AnimationFrameID: true,
  },
  rules: {
    // Error on prettier violations
    'prettier/prettier': 'error',

    // New eslint style rules that is not disabled by prettier:
    'lines-between-class-members': 'off',

    // Allowing warning and error console logging
    // use `invariant` and `warning`
    'no-console': ['error'],

    // Opting out of prefer destructuring (nicer with flow in lots of cases)
    'prefer-destructuring': 'off',

    // Disallowing the use of variables starting with `_` unless it called on `this`.
    // Allowed: `this._secret = Symbol()`
    // Not allowed: `const _secret = Symbol()`
    'no-underscore-dangle': ['error', { allowAfterThis: true }],

    // Cannot reassign function parameters but allowing modification
    'no-param-reassign': ['error', { props: false }],

    // Allowing ++ on numbers
    'no-plusplus': 'off',

    'no-restricted-syntax': [
      // Nicer booleans #1
      // Disabling the use of !! to cast to boolean
      'error',
      {
        selector:
          'UnaryExpression[operator="!"] > UnaryExpression[operator="!"]',
        message:
          '!! to cast to boolean relies on a double negative. Use Boolean() instead',
      },
      // Nicer booleans #2
      // Avoiding accidental `new Boolean()` calls
      // (also covered by `no-new-wrappers` but i am having fun)
      {
        selector: 'NewExpression[callee.name="Boolean"]',
        message:
          'Avoid using constructor: `new Boolean(value)` as it creates a Boolean object. Did you mean `Boolean(value)`?',
      },
      // We are using a useLayoutEffect / useEffect switch to avoid SSR warnings for useLayoutEffect
      // We want to ensure we use `import useEffect from '*use-isomorphic-layout-effect'`
      // to ensure we still get the benefits of `eslint-plugin-react-hooks`
      {
        selector:
          'ImportDeclaration[source.value=/use-isomorphic-layout-effect/] > ImportDefaultSpecifier[local.name!="useLayoutEffect"]',
        message:
          'Must use `useLayoutEffect` as the name of the import from `*use-isomorphic-layout-effect` to leverage `eslint-plugin-react-hooks`',
      },
    ],

    // Allowing Math.pow rather than forcing `**`
    'no-restricted-properties': [
      'off',
      {
        object: 'Math',
        property: 'pow',
      },
    ],

    'no-restricted-imports': [
      'error',
      {
        paths: [
          // Forcing use of useMemoOne
          {
            name: 'react',
            importNames: ['useMemo', 'useCallback'],
            message:
              '`useMemo` and `useCallback` are subject to cache busting. Please use `useMemoOne`',
          },
          // Forcing use aliased imports from useMemoOne
          {
            name: 'use-memo-one',
            importNames: ['useMemoOne', 'useCallbackOne'],
            message:
              'use-memo-one exports `useMemo` and `useCallback` which work nicer with `eslint-plugin-react-hooks`',
          },
          // Disabling using of useLayoutEffect from react
          {
            name: 'react',
            importNames: ['useLayoutEffect'],
            message:
              '`useLayoutEffect` causes a warning in SSR. Use `useIsomorphicLayoutEffect`',
          },
        ],
      },
    ],

    // Allowing jsx in files with any file extension (old components have jsx but not the extension)
    'react/jsx-filename-extension': 'off',

    // Not requiring default prop declarations all the time
    'react/require-default-props': 'off',

    // Opt out of preferring stateless functions
    'react/prefer-stateless-function': 'off',

    // Allowing files to have multiple components in it
    'react/no-multi-comp': 'off',

    // Sometimes we use the PropTypes.object PropType for simplicity
    'react/forbid-prop-types': 'off',

    // Allowing the non function setState approach
    'react/no-access-state-in-setstate': 'off',

    // Opting out of this
    'react/destructuring-assignment': 'off',

    // Adding 'skipShapeProps' as the rule has issues with correctly handling PropTypes.shape
    'react/no-unused-prop-types': ['error', { skipShapeProps: true }],

    // Having issues with this rule not working correctly
    'react/default-props-match-prop-types': 'off',

    // Require // @flow at the top of files
    'flowtype/require-valid-file-annotation': [
      'error',
      'always',
      { annotationStyle: 'line' },
    ],

    // Allowing importing from dev deps (for stories and tests)
    'import/no-extraneous-dependencies': 'off',

    // Enforce rules of hooks
    'react-hooks/rules-of-hooks': 'error',
    // Second argument to hook functions
    'react-hooks/exhaustive-deps': 'warn',
  },
};
