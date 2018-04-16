// @flow
import invariant from 'invariant';
import type { Position, Area, Viewport } from '../../types';
import getArea from '../../state/get-area';
import getWindowScroll from './get-window-scroll';
import getMaxScroll from '../../state/get-max-scroll';

export default (): Viewport => {
  const scroll: Position = getWindowScroll();

  const top: number = scroll.y;
  const left: number = scroll.x;

  const doc: ?HTMLElement = document.documentElement;

  invariant(doc, 'Could not find document.documentElement');

  // Using these values as they do not consider scrollbars
  const width: number = doc.clientWidth;
  const height: number = doc.clientHeight;

  // Computed
  const right: number = left + width;
  const bottom: number = top + height;

  const subject: Area = getArea({
    top, left, right, bottom,
  });

  const maxScroll: Position = getMaxScroll({
    scrollHeight: doc.scrollHeight,
    scrollWidth: doc.scrollWidth,
    width: subject.width,
    height: subject.height,
  });

  const viewport: Viewport = {
    subject,
    maxScroll,
    scroll,
  };

  return viewport;
};
