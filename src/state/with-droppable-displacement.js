// @flow
import { add } from './position';
import type {
  Position,
  ClosestScrollable,
  DroppableDimension,
} from '../types';

const origin: Position = { x: 0, y: 0 };

export default (droppable: DroppableDimension, point: Position): Position => {
  const closestScrollable: ?ClosestScrollable = droppable.viewport.closestScrollable;
  if (!closestScrollable) {
    return origin;
  }

  return add(point, closestScrollable.scroll.diff.displacement);
};
