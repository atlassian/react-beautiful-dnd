// @flow
import { subtract } from './position';
import type {
  Position,
  ClosestScrollable,
  DroppableDimension,
} from '../types';

export default (droppable: DroppableDimension, point: Position): Position => {
  const closestScrollable: ?ClosestScrollable = droppable.viewport.closestScrollable;
  if (!closestScrollable) {
    return point;
  }

  return subtract(point, closestScrollable.scroll.diff.value);
};
