// @flow
import isElement from './is-element';

export default (el: Object): boolean => {
  // Some test runners are not aware of the SVGElement constructor
  // We opt out of this check for those environments
  // $FlowFixMe - flow does not know about SVGElement
  if (typeof SVGElement === 'undefined') {
    return false;
  }

  // duck typing not needed
  if (el instanceof SVGElement) {
    return true;
  }

  // duck typing
  return isElement(el) && el.nodeName.toLowerCase() === 'svg';
};
