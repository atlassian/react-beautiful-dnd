// @flow
import { type Position } from 'css-box-model';
import { add } from './position';
import type {
  Scrollable,
  DroppableDimension,
} from '../types';

export default (droppable: DroppableDimension, point: Position): Position => {
  const closestScrollable: ?Scrollable = droppable.viewport.closestScrollable;
  if (!closestScrollable) {
    return point;
  }

  return add(point, closestScrollable.scroll.diff.displacement);
};
