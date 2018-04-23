// @flow
import { add } from './position';
import type {
  Position,
  Scrollable,
  DroppableDimension,
} from '../types';

export default (droppable: DroppableDimension, point: Position): Position => {
  const closestScrollable: ?Scrollable = droppable.viewport.closestScrollable;
  if (!closestScrollable) {
    return point;
  }

  return add(point, closestScrollable.scroll.diff.value);
};
