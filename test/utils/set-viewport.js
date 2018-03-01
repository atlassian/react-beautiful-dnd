// @flow
import type { Viewport } from '../../src/types';
import getViewport from '../../src/view/window/get-viewport';

const getDoc = (): HTMLElement => {
  const el: ?HTMLElement = document.documentElement;

  if (!el) {
    throw new Error('Unable to get document.documentElement');
  }

  return el;
};

const setViewport = (custom: Viewport) => {
  if (custom.scroll.x !== custom.subject.left) {
    throw new Error('scroll x must match left of subject');
  }
  if (custom.scroll.y !== custom.subject.top) {
    throw new Error('scroll y must match top of subject');
  }

  window.pageYOffset = custom.scroll.y;
  window.pageXOffset = custom.scroll.x;

  const doc: HTMLElement = getDoc();
  doc.clientWidth = custom.subject.width;
  doc.clientHeight = custom.subject.height;

  // reverse engineering these values
  const scrollHeight: number = custom.maxScroll.y + custom.subject.height;
  const scrollWidth: number = custom.maxScroll.x + custom.subject.width;

  doc.scrollHeight = scrollHeight;
  doc.scrollWidth = scrollWidth;
};

export const getCurrent = (): Viewport => getViewport();

const original: Viewport = getCurrent();

export const resetViewport = () => setViewport(original);

export default setViewport;
