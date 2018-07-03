// @flow
import invariant from 'tiny-invariant';
import { getRect, type Rect, type Position } from 'css-box-model';
import type { Viewport } from '../../types';
import { origin } from '../../state/position';
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

  const frame: Rect = getRect({
    top,
    left,
    right,
    bottom,
  });

  const maxScroll: Position = getMaxScroll({
    scrollHeight: doc.scrollHeight,
    scrollWidth: doc.scrollWidth,
    width: frame.width,
    height: frame.height,
  });

  const viewport: Viewport = {
    frame,
    scroll: {
      initial: scroll,
      current: scroll,
      max: maxScroll,
      diff: {
        value: origin,
        displacement: origin,
      },
    },
  };

  return viewport;
};
