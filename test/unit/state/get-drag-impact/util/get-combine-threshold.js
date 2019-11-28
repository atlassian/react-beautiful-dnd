// @flow
import type { Position } from 'css-box-model';
import type { Axis, DraggableDimension } from '../../../../../src/types';
import { patch } from '../../../../../src/state/position';

export function getThreshold(
  axis: Axis,
  draggable: DraggableDimension,
): Position {
  return patch(axis.line, draggable.page.borderBox[axis.size] / 5);
}
