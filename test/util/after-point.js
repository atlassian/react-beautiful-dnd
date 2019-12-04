// @flow
import type { Position } from 'css-box-model';
import type { Axis } from '../../src/types';
import { add, patch } from '../../src/state/position';

export default function afterPoint(axis: Axis, point: Position): Position {
  return add(point, patch(axis.line, 1));
}

export function afterCrossAxisPoint(axis: Axis, point: Position): Position {
  return add(point, patch(axis.crossAxisLine, 1));
}
