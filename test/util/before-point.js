// @flow
import type { Position } from 'css-box-model';
import type { Axis } from '../../src/types';
import { subtract, patch } from '../../src/state/position';

export default function beforePoint(axis: Axis, point: Position): Position {
  return subtract(point, patch(axis.line, 1));
}

export function beforeCrossAxisPoint(axis: Axis, point: Position): Position {
  return subtract(point, patch(axis.crossAxisLine, 1));
}
