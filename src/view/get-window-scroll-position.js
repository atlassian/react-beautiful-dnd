// @flow
import type { Position } from '../types';

const origin: Position = { x: 0, y: 0 };

export default (): Position => {
  const el: ?HTMLElement = document.documentElement;

  // should never happen
  if (!el) {
    return origin;
  }

  return {
    x: el.scrollLeft,
    y: el.scrollTop,
  };
};

