// @flow

export type Env = {|
  closestScrollable: ?Element,
  isFixedOnPage: boolean,
|};

const isScrollable = (style: CSSStyleDeclaration): boolean =>
  [style.overflow, style.overflowY, style.overflowX].some(
    (value: string) => value === 'auto' || value === 'scroll',
  );

const isFixed = (style: CSSStyleDeclaration) => style.position === 'fixed';

const find = (
  el: ?Element,
  closestScrollable: ?Element,
  isFixedOnPage: boolean = false,
): Env => {
  // both values populated - can return
  if (closestScrollable && isFixedOnPage) {
    return {
      closestScrollable,
      isFixedOnPage,
    };
  }

  // cannot go any higher - return what we have
  if (el == null) {
    return {
      closestScrollable,
      isFixedOnPage,
    };
  }

  const style: CSSStyleDeclaration = window.getComputedStyle(el);

  const closest: ?Element =
    closestScrollable || (isScrollable(style) ? el : null);
  const fixed: boolean = isFixedOnPage || isFixed(style);

  return find(el.parentElement, closest, fixed);
};

export default (start: Element): Env => find(start);
