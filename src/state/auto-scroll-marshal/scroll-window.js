// @flow
import { offset } from '../spacing';
import getViewport from '../visibility/get-viewport';
import type {
  Area,
  Position,
  Spacing,
} from '../../types';

// Will return true if can scroll even a little bit in either direction
// of the change.
const canScroll = (change: Position): boolean => {
  const viewport: Area = getViewport();

  const shifted: Spacing = offset(viewport, change);

  // TEMP
  // if (shifted.left === 0 && shifted.top === 0) {
  //   return true;
  // }

  // moving back beyond origin
  if (shifted.left <= 0 && shifted.top <= 0) {
    return false;
  }

  const el: ?HTMLElement = document.documentElement;

  if (!el) {
    console.error('Cannot find document element');
    return false;
  }

  // totally outside the full height of the page
  if (shifted.right >= el.scrollWidth && shifted.bottom >= el.scrollHeight) {
    return false;
  }

  return true;
};

export default (change: Position): void => {
  if (canScroll(change)) {
    window.scrollBy(change.x, change.y);
  } else {
    console.log('cannot scroll window!', change);
  }
};

