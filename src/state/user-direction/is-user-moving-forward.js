// @flow
import type { Axis, UserDirection } from '../../types';
import { vertical } from '../axis';

export default (axis: Axis, direction: UserDirection): boolean =>
  axis === vertical
    ? direction.vertical === 'down'
    : direction.horizontal === 'right';
