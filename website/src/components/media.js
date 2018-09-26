// @flow

type WhenRuleFn = (...args: mixed[]) => mixed;

type MediaRule = {|
  query: string,
  negatedQuery: string,
  fn: WhenRuleFn,
|};

// eslint-disable-next-line import/prefer-default-export
export const smallView: MediaRule = (() => {
  const query: string = '(max-width: 1300px)';
  const negatedQuery: string = '(min-width: 1300px)';

  // $ExpectError - incorrect typing for css function
  const fn: WhenRuleFn = (...args) => `@media ${query} { ${args} }`;

  return {
    query,
    fn,
    negatedQuery,
  };
})();
