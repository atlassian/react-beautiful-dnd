// @flow
const isScrollable = (...values: string[]): boolean =>
  values.some(
    (value: string): boolean => value === 'auto' || value === 'scroll',
  );

const isElementScrollable = (el: Element) => {
  const style = window.getComputedStyle(el);
  return isScrollable(style.overflow, style.overflowY, style.overflowX);
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
