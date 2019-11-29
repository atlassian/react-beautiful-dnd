// @flow
import type { Position, Rect } from 'css-box-model';
import type { Axis } from '../../../../../src/types';
import { add, patch, subtract } from '../../../../../src/state/position';

type ForStart = {|
  startEdgeOn: Position,
  dragging: Rect,
  axis: Axis,
|};

export function getOffsetForStartEdge({
  startEdgeOn,
  dragging,
  axis,
}: ForStart): Position {
  const offset: Position = subtract(
    startEdgeOn,
    patch(axis.line, dragging[axis.start], dragging.center[axis.crossAxisLine]),
  );
  return offset;
}

type ForEnd = {|
  endEdgeOn: Position,
  dragging: Rect,
  axis: Axis,
|};

export function getOffsetForEndEdge({
  endEdgeOn,
  dragging,
  axis,
}: ForEnd): Position {
  const offset: Position = subtract(
    endEdgeOn,
    patch(axis.line, dragging[axis.end], dragging.center[axis.crossAxisLine]),
  );
  return offset;
}
