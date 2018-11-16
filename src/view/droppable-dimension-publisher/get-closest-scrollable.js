// @flow
import invariant from 'tiny-invariant';

const visible: string = 'visible';
const scroll: string = 'scroll';
const auto: string = 'auto';

type Overflow = {|
  overflowX: string,
  overflowY: string,
|};

const isEqual = (a: string, b: string) => a === b;

const isOverflowScrollable = ({ overflowX, overflowY }: Overflow): boolean =>
  isEqual(overflowX, scroll) ||
  isEqual(overflowY, scroll) ||
  isEqual(overflowX, auto) ||
  isEqual(overflowY, auto);

const isElementScrollable = (el: Element): boolean => {
  const style: CSSStyleDeclaration = window.getComputedStyle(el);
  const computed: Overflow = {
    overflowX: style.overflowX,
    overflowY: style.overflowY,
  };

  return isOverflowScrollable(computed);
};

const isCurrentlyOverflowed = (el: Element): boolean =>
  el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;

// Special case for a body element
// Playground: https://codepen.io/alexreardon/pen/ZmyLgX?editors=1111
const isBodyScrollable = (el: Element): boolean => {
  // if the body is not 'scrollable' then it won't be a scroll container
  if (!isElementScrollable(el)) {
    return false;
  }

  // body can become a scroll container if the document.documentElement (html)
  // element has `overflow-[x|y]` set to anything except `hidden`

  const html: ?Element = el.parentElement;
  invariant(
    html && html === document.documentElement,
    'Unexpected parent of body',
  );

  const style: CSSStyleDeclaration = window.getComputedStyle(html);
  const parent: Overflow = {
    overflowX: style.overflowX,
    overflowY: style.overflowY,
  };

  // scrollbar will be on html
  if (
    isEqual(parent.overflowX, visible) &&
    isEqual(parent.overflowY, visible)
  ) {
    return false;
  }

  return isCurrentlyOverflowed(el);
};

const getClosestScrollable = (el: ?Element): ?Element => {
  // cannot do anything else!
  if (el == null) {
    return null;
  }

  // not allowing us to go higher then body
  if (el === document.body) {
    return isBodyScrollable(el) ? el : null;
  }

  // just being really clear
  invariant(
    el !== document.documentElement,
    'Should not get to document.documentElement in recursion',
  );

  if (!isElementScrollable(el)) {
    return getClosestScrollable(el.parentElement);
  }

  // success!
  return el;
};

export default getClosestScrollable;
