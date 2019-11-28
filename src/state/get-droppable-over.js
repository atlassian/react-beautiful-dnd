// @flow
import type { Position, Rect, BoxModel } from 'css-box-model';
import { toDroppableList } from './dimension-structures';

import type {
  DroppableDimension,
  DraggableDimension,
  DroppableDimensionMap,
} from '../types';

const isWithin = (
  lowerBound: number,
  upperBound: number,
): (number => boolean) => (value: number): boolean =>
  lowerBound <= value && value <= upperBound;

const isPositionIntersecting = (frame: Rect) => {
  const isWithinVertical = isWithin(frame.top, frame.bottom);
  const isWithinHorizontal = isWithin(frame.left, frame.right);
  const frameCenter = frame.center.x;

  return (point: Position, draggableDimensions: BoxModel) => {
    const { width: draggableWidth } = draggableDimensions.contentBox;
    const isWithinBounds =
      isWithinVertical(point.y) && isWithinHorizontal(point.x);
    const isCollidingLeft = frameCenter > point.x - draggableWidth / 2;
    const isCollidingRight = frameCenter < point.x + draggableWidth / 2;

    console.log('RESULT', isWithinBounds, isCollidingLeft, isCollidingRight);

    if (isCollidingLeft && point.x > frameCenter) {
      return true;
    }

    if (isCollidingRight && point.x <= frameCenter) {
      return true;
    }

    if (isWithinBounds) {
      return true;
    }

    // TODO we might be able to use this instead of isWithinBounds
    // if (isCollidingLeft && isCollidingRight) {
    //   return true;
    // }

    return false;
  };
};

type Args = {|
  target: Position,
  draggable: DraggableDimension,
  droppables: DroppableDimensionMap,
|};

export default ({
  target,
  draggable,
  droppables,
}: Args): DroppableDimension[] => {
  return toDroppableList(droppables).filter(
    (droppable: DroppableDimension): boolean => {
      // only want enabled droppables
      if (!droppable.isEnabled) {
        return false;
      }

      const active: ?Rect = droppable.subject.active;

      if (!active) {
        return false;
      }

      // Not checking to see if visible in viewport
      // as the target might be off screen if dragging a large draggable
      // Not adjusting target for droppable scroll as we are just checking
      // if it is over the droppable - not its internal impact
      return isPositionIntersecting(active)(target, draggable.client);
    },
  );
};
