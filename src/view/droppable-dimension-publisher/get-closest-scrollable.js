// @flow
import invariant from 'tiny-invariant';
import { warning } from '../../dev-warning';

type Overflow = {|
  overflowX: string,
  overflowY: string,
|};

const isEqual = (base: string) => (value: string): boolean => base === value;
const isScroll = isEqual('scroll');
const isAuto = isEqual('auto');
const isVisible = isEqual('visible');
const isEither = (overflow: Overflow, fn: (value: string) => boolean) =>
  fn(overflow.overflowX) || fn(overflow.overflowY);
const isBoth = (overflow: Overflow, fn: (value: string) => boolean) =>
  fn(overflow.overflowX) && fn(overflow.overflowY);

const isElementScrollable = (el: Element): boolean => {
  const style: CSSStyleDeclaration = window.getComputedStyle(el);
  const overflow: Overflow = {
    overflowX: style.overflowX,
    overflowY: style.overflowY,
  };

  return isEither(overflow, isScroll) || isEither(overflow, isAuto);
};

// Special case for a body element
// Playground: https://codepen.io/alexreardon/pen/ZmyLgX?editors=1111
const isBodyScrollable = (): boolean => {
  // Because we always return false for now, we can skip any actual processing in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const body: ?HTMLBodyElement = document.body;
  invariant(body);
  const html: ?HTMLElement = document.documentElement;
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

  if (isBoth(htmlOverflow, isVisible)) {
    return false;
  }

  // TODO: warning
  warning('TODO');
  return false;
};

const getClosestScrollable = (el: ?Element): ?Element => {
  console.log('checking', el);
  // cannot do anything else!
  if (el == null) {
    return null;
  }

  // not allowing us to go higher then body
  if (el === document.body) {
    console.log('hit body');
    return isBodyScrollable() ? el : null;
  }

  // Should never get here, but just being safe
  if (el === document.documentElement) {
    console.log('hit document.documentElement');
    return null;
  }

  if (isElementScrollable(el)) {
    // success!
    return el;
  }

  // keep recursing
  return getClosestScrollable(el.parentElement);
};

export default getClosestScrollable;
