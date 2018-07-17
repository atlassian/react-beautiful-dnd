// @flow
const isScrollable = (...values: string[]): boolean =>
  values.some(
    (value: string): boolean => value === 'auto' || value === 'scroll',
  );

const isElementScrollable = (el: Element) => {
  const style = window.getComputedStyle(el);
  return isScrollable(style.overflow, style.overflowY, style.overflowX);
};

const getClosestScrollable = (el: ?Element): ?HTMLElement => {
  // cannot do anything else!
  if (el == null) {
    return null;
  }

  if (!(el instanceof HTMLElement)) {
    return getClosestScrollable(el.parentElement);
  }

  if (!isElementScrollable(el)) {
    return getClosestScrollable(el.parentElement);
  }

  // success!
  return el;
};

export default getClosestScrollable;
