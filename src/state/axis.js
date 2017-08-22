// @flow
import type { HorizontalAxis, VerticalAxis } from '../types';

export const vertical: VerticalAxis = {
  direction: 'vertical',
  line: 'y',
  start: 'top',
  end: 'bottom',
  size: 'height',
};

export const horizontal: HorizontalAxis = {
  direction: 'horizontal',
  line: 'x',
  start: 'left',
  end: 'right',
  size: 'width',
};
