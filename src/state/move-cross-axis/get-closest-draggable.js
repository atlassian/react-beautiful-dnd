// @flow
import { distance } from '../position';
import isVisibleThroughFrame from '../visibility/is-visible-through-frame';
import isVisibleThroughDroppableFrame from '../visibility/is-visible-through-droppable-frame';
import getViewport from '../visibility/get-viewport';
import type {
  Axis,
  Position,
  DraggableDimension,
  DroppableDimension,
} from '../../types';

type Args = {|
  axis: Axis,
  pageCenter: Position,
  // the droppable that is being moved to
  destination: DroppableDimension,
  // the droppables inside the destination
  insideDestination: DraggableDimension[],
|}

export default ({
  axis,
  pageCenter,
  destination,
  insideDestination,
}: Args): ?DraggableDimension => {
  // Empty list - bail out
  if (!insideDestination.length) {
    return null;
  }

  const inViewport = isVisibleThroughFrame(getViewport());
  const inDroppable = isVisibleThroughDroppableFrame(destination);

  const result: DraggableDimension[] = insideDestination
    // Remove any options that are hidden by overflow
    // Whole draggable must be visible to move to it
    .filter((draggable: DraggableDimension): boolean =>
      inViewport(draggable.page.withMargin) &&
      inDroppable(draggable.page.withMargin))
    .sort((a: DraggableDimension, b: DraggableDimension): number => {
      const distanceToA = distance(pageCenter, a.page.withMargin.center);
      const distanceToB = distance(pageCenter, b.page.withMargin.center);

      // if a is closer - return a
      if (distanceToA < distanceToB) {
        return -1;
      }

      // if b is closer - return b
      if (distanceToB < distanceToA) {
        return 1;
      }

      // if the distance to a and b are the same:
      // return the one that appears first on the main axis
      return a.page.withMargin[axis.start] - b.page.withMargin[axis.start];
    });

  return result.length ? result[0] : null;
};
