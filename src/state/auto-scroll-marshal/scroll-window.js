// @flow
import { offsetByPosition } from '../spacing';
import getViewport from '../visibility/get-viewport';
import type {
  Area,
  Position,
  Spacing,
} from '../../types';

const getSmallestSignedValue = (value: number) => {
  if (value === 0) {
    return 0;
  }
  return value > 0 ? 1 : -1;
};

// Will return true if can scroll even a little bit in either direction
// of the change.
export const canScroll = (change: Position): boolean => {
  const viewport: Area = getViewport();
  // Only need to be able to move the smallest amount in the desired direction
  const smallestChange: Position = {
    x: getSmallestSignedValue(change.x),
    y: getSmallestSignedValue(change.y),
  };

  const shifted: Spacing = offsetByPosition(viewport, smallestChange);

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

// Not guarenteed to scroll by the entire amount
export default (change: Position): void => {
  if (canScroll(change)) {
    console.log('scrolling window by ', change);
    window.scrollBy(change.x, change.y);
  } else {
    console.log('cannot scroll window!', change);
  }
};

