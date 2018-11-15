// @flow
import { warning } from '../../dev-warning';

type Overflow = {|
  overflowX: string,
  overflowY: string,
|};

const hidden: string = 'hidden';
const scroll: string = 'scroll';
const auto: string = 'auto';
const isEqual = (a: string, b: string) => a === b;

const isOverflowHidden = ({ overflowX, overflowY }: Overflow): boolean =>
  isEqual(overflowX, hidden) || isEqual(overflowY, hidden);

const isOverflowScrollable = ({ overflowX, overflowY }: Overflow): boolean =>
  isEqual(overflowX, scroll) ||
  isEqual(overflowY, scroll) ||
  isEqual(overflowX, auto) ||
  isEqual(overflowY, auto);

// https://twitter.com/alexandereardon/status/1058210532824616960
const isCurrentlyOverflowed = (el: Element): boolean =>
  el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientWidth;

const isElementScrollable = (el: Element): boolean => {
  // body and document.documentElement cannot be a scroll container
  // scroll on these will occur on the window / document
  if (el === document.body || el === document.documentElement) {
    return false;
  }

  const style: CSSStyleDeclaration = window.getComputedStyle(el);
  const computed: Overflow = {
    overflowX: style.overflowX,
    overflowY: style.overflowY,
  };

  // standard check
  if (!isOverflowHidden(computed)) {
    return isOverflowScrollable(computed);
  }

  // We have encountered an element with overflowY or overflowX set to hidden
  // when overflow-x: hidden or overflow-y: hidden then the opposite will be computed as 'auto'
  // https://www.w3.org/TR/css-overflow-3/#overflow-properties

  // So we need to try some alternative mechanisms to see if it is scrollable

  // both properties set to hidden - not a scroll container
  if (
    isEqual(computed.overflowX, hidden) &&
    isEqual(computed.overflowY, hidden)
  ) {
    return false;
  }

  const hasScrollOverflow: boolean = isCurrentlyOverflowed(el);

  if (process.env.NODE_ENV !== 'production') {
    // logging the raw element for easier debugging
    // eslint-disable-next-line
    console.warn(el);
  }
  warning(`
    We are attempting to figure out the scroll containers for your application.
    We have detected an element with an overflow property set to hidden:
    ${JSON.stringify(computed)}

    We are falling back to a weaker spacing check to see if the element is scrollable

    Is a scroll container? ${hasScrollOverflow ? 'yes' : 'no'}
  `);

  return hasScrollOverflow;
};

const getClosestScrollable = (el: ?Element): ?Element => {
  // cannot do anything else!
  if (el == null) {
    return null;
  }

  if (!isElementScrollable(el)) {
    return getClosestScrollable(el.parentElement);
  }

  // success!
  return el;
};

export default getClosestScrollable;
