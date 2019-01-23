// @flow
import getWindowFromEl from '../window/get-window-from-el';

export default function isSvgElement(el: Object): boolean %checks {
  return el instanceof getWindowFromEl(el).SVGElement;
}
