// @flow
import type { Position, Rect } from 'css-box-model';
import type { Axis } from '../../../../../src/types';
import { add, patch, subtract } from '../../../../../src/state/position';

type ForStart = {|
  startEdgeOn: Position,
  dragging: Rect,
  axis: Axis,
|};

export function getCenterForStartEdge({
  startEdgeOn,
  dragging,
  axis,
}: ForStart): Position {
  const halfSize: number = dragging[axis.size] / 2;

  const center: Position = add(startEdgeOn, patch(axis.line, halfSize));
  return center;
}

type ForEnd = {|
  endEdgeOn: Position,
  dragging: Rect,
  axis: Axis,
|};

export function getCenterForEndEdge({
  endEdgeOn,
  dragging,
  axis,
}: ForEnd): Position {
  const halfSize: number = dragging[axis.size] / 2;

  const center: Position = subtract(endEdgeOn, patch(axis.line, halfSize));

  return center;
}
