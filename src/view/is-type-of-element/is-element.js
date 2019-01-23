// @flow
import getWindowForEl from '../get-window-for-el';

export default (el: Object): boolean =>
  el instanceof getWindowForEl(el).Element;
