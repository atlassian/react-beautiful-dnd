// @flow
import type { HorizontalAxis, VerticalAxis } from '../types';

export const vertical: VerticalAxis = {
  direction: 'vertical',
  line: 'y',
  crossLine: 'x',
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
  crossLine: 'y',
  start: 'left',
  end: 'right',
  size: 'width',
  crossAxisStart: 'top',
  crossAxisEnd: 'bottom',
  crossAxisSize: 'height',
};
