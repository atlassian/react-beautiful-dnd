// @flow
import { hasOwnProperty } from '../../native-with-fallback';

export default (el: Object): boolean => {
  // duck typing not needed
  if (el instanceof Element) {
    return true;
  }
  // duck type
  return hasOwnProperty(el, 'nodeType') && el.nodeType === 1;
};
