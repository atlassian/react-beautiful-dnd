// @flow
import getWindowFromEl from '../window/get-window-from-el';

export default (el: Object): boolean =>
  el instanceof getWindowFromEl(el).HTMLElement;
