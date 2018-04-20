// @flow
import { css } from 'styled-components';

type WhenRuleFn = (...args: mixed[]) => mixed;

type MediaRule = {|
  query: string,
  fn: WhenRuleFn,
|}

export const singleColumn: MediaRule = (() => {
  const query: string = 'screen and (max-width: 1350px)';

  const fn: WhenRuleFn = (...args: mixed[]) => `@media ${query} { ${css(...args)} }`;

  return {
    query, fn,
  }
})();