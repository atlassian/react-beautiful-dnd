// @flow
import isElement from './is-element';

export default (el: Object): boolean => {
  // duck typing not needed
  if (el instanceof HTMLElement) {
    return true;
  }
  // duck type
  return (
    isElement(el) && typeof el.style === 'object' && typeof el.dir === 'string'
  );
};
