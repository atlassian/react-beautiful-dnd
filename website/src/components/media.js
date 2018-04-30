// @flow
import { css } from 'styled-components';

type WhenRuleFn = (...args: mixed[]) => mixed;

type MediaRule = {|
  query: string,
  fn: WhenRuleFn,
|}

// eslint-disable-next-line import/prefer-default-export
export const singleColumn: MediaRule = (() => {
  const query: string = 'screen and (max-width: 1300px)';

  // $ExpectError - incorrect typing for css function
  const fn: WhenRuleFn = (...args) => `@media ${query} { ${css(...args)} }`;

  return {
    query, fn,
  };
})();
