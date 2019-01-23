// @flow
import getWindowForEl from '../get-window-for-el';

export default (el: Object): boolean => {
  // Some test runners are not aware of the SVGElement constructor
  // We opt out of this check for those environments
  // $FlowFixMe - flow does not know about SVGElement
  if (typeof SVGElement === 'undefined') {
    return false;
  }

  return el instanceof getWindowForEl(el).SVGElement;
};
