// @flow
import { add } from './position';
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

  return add(point, closestScrollable.scroll.diff.displacement);
};
