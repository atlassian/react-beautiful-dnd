// @flow
import getWindowFromEl from '../window/get-window-from-el';

export default function isSvgElement(el: Object): boolean %checks {
  // Some environments do not support SVGElement
  // Doing a double lookup rather than storing the window
  // as a %checks function can only be a 'simple predicate'
  return (
    Boolean(getWindowFromEl(el).SVGElement) &&
    el instanceof getWindowFromEl(el).SVGElement
  );
}
