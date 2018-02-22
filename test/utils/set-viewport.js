// @flow
import type { Area } from '../../src/types';
import getArea from '../../src/state/get-area';

const getDoc = (): HTMLElement => {
  const el: ?HTMLElement = document.documentElement;

  if (!el) {
    throw new Error('Unable to get document.documentElement');
  }

  return el;
};

const setViewport = (custom: Area) => {
  if (custom.top !== 0 || custom.left !== 0) {
    throw new Error('not setting window scroll with setViewport. Use set-window-scroll');
  }

  if (window.pageXOffset !== 0 || window.pageYOffset !== 0) {
    throw new Error('Setting viewport on scrolled window');
  }

  window.pageYOffset = 0;
  window.pageXOffset = 0;

  const doc: HTMLElement = getDoc();
  doc.clientWidth = custom.width;
  doc.clientHeight = custom.height;
};

export const getCurrent = (): Area => {
  const doc: HTMLElement = getDoc();

  return getArea({
    top: window.pageYOffset,
    left: window.pageXOffset,
    width: doc.clientWidth,
    height: doc.clientHeight,
  });
};

const original: Area = getCurrent();

export const resetViewport = () => setViewport(original);

export default setViewport;
