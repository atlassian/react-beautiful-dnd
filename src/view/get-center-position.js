// @flow
import type { Position, HTMLElement } from '../types';

export default (el: HTMLElement): Position => {
  const { top, right, bottom, left } = el.getBoundingClientRect();
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  return {
    x: centerX,
    y: centerY,
  };
};
