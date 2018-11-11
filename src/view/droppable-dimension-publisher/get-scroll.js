// @flow
import type { Position } from 'css-box-model';

export default (el: Element): Position => ({
  x: el.scrollLeft,
  y: el.scrollTop,
});
