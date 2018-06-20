// @flow
import type { Axis, HorizontalAxis, VerticalAxis } from '../types';

export const vertical: VerticalAxis = {
  direction: 'vertical',
  line: 'y',
  crossAxisLine: 'x',
  start: 'top',
  end: 'bottom',
  size: 'height',
  crossAxisStart: 'left',
  crossAxisEnd: 'right',
  crossAxisSize: 'width',
};

export const horizontal: HorizontalAxis = {
  direction: 'horizontal',
  line: 'x',
  crossAxisLine: 'y',
  start: 'left',
  end: 'right',
  size: 'width',
  crossAxisStart: 'top',
  crossAxisEnd: 'bottom',
  crossAxisSize: 'height',
};

export function oppositeAxis(axis: Axis) {
  if (axis.direction === 'horizontal') {
    return vertical;
  }
  return horizontal;
}
