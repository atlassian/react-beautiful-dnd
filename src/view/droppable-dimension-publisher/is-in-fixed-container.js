// @flow

const isElementFixed = (el: Element): boolean =>
  window.getComputedStyle(el).position === 'fixed';

const find = (el: ?Element): boolean => {
  // cannot do anything else!
  if (el == null) {
    return false;
  }

  // keep looking
  if (!isElementFixed(el)) {
    return find(el.parentElement);
  }

  // success!
  return true;
};

export default find;
