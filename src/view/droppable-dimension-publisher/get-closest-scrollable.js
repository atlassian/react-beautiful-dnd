// @flow
import invariant from 'tiny-invariant';
import { warning } from '../../dev-warning';

const visible: string = 'visible';
const scroll: string = 'scroll';
const auto: string = 'auto';

type Overflow = {|
  overflowX: string,
  overflowY: string,
|};

const isEqual = (a: string, b: string) => a === b;
const isEither = (overflow: Overflow, value: string) =>
  isEqual(overflow.overflowX, value) || isEqual(overflow.overflowY, value);
const isBoth = (overflow: Overflow, value: string) =>
  isEqual(overflow.overflowX, value) && isEqual(overflow.overflowY, value);

const isOverflowScrollable = (overflow: Overflow): boolean =>
  isEither(overflow, scroll) || isEither(overflow, auto);

const isElementScrollable = (el: Element): boolean => {
  const style: CSSStyleDeclaration = window.getComputedStyle(el);
  const computed: Overflow = {
    overflowX: style.overflowX,
    overflowY: style.overflowY,
  };

  return isOverflowScrollable(computed);
};

// Special case for a body element
// Playground: https://codepen.io/alexreardon/pen/ZmyLgX?editors=1111
const isBodyScrollable = (): boolean => {
  // Because we always return false for now, we can skip any actual processing in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const body: ?HTMLBodyElement = document.body;
  const html: ?HTMLElement = document.documentElement;
  invariant(body);
  invariant(html);

  // 1. The `body` has `overflow-[x|y]: auto | scroll`
  if (!isElementScrollable(body)) {
    return false;
  }

  const htmlStyle: CSSStyleDeclaration = window.getComputedStyle(html);
  const htmlOverflow: Overflow = {
    overflowX: htmlStyle.overflowX,
    overflowY: htmlStyle.overflowY,
  };

  if (isBoth(htmlOverflow, visible)) {
    return false;
  }

  // TODO: warning
  return false;
};

const getClosestScrollable = (el: ?Element): ?Element => {
  // cannot do anything else!
  if (el == null) {
    return null;
  }

  // not allowing us to go higher then body
  if (el === document.body) {
    return isBodyScrollable() ? el : null;
  }

  if (!isElementScrollable(el)) {
    return getClosestScrollable(el.parentElement);
  }

  // success!
  return el;
};

export default getClosestScrollable;
