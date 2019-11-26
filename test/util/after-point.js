// @flow
import type { Position } from 'css-box-model';
import type { Axis } from '../../src/types';
import { add, patch } from '../../src/state/position';

export default (axis: Axis, point: Position): Position =>
  add(point, patch(axis.line, 1));
