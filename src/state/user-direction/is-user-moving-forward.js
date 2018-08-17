// @flow
import type { Axis, UserDirection } from '../../types';
import { vertical } from '../axis';

export default (direction: UserDirection, axis: Axis): boolean =>
  axis === vertical
    ? direction.vertical === 'down'
    : direction.horizontal === 'right';
