// @flow
import type { Position } from '../types';

export default (): Position => ({
  x: window.pageXOffset,
  y: window.pageYOffset,
});

