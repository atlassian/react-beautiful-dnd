// @flow
import { distance } from '../position';
import getViewport from '../../window/get-viewport';
import { isTotallyVisible } from '../visibility/is-visible';
import withDroppableDisplacement from '../with-droppable-displacement';
import type {
  Area,
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

  const viewport: Area = getViewport();

  const result: DraggableDimension[] = insideDestination
    // Remove any options that are hidden by overflow
    // Draggable must be totally visible to move to it
    .filter((draggable: DraggableDimension): boolean =>
      isTotallyVisible({
        target: draggable.page.withMargin,
        destination,
        viewport,
      }))
    .sort((a: DraggableDimension, b: DraggableDimension): number => {
      // Need to consider the change in scroll in the destination
      const distanceToA = distance(
        pageCenter,
        withDroppableDisplacement(destination, a.page.withMargin.center)
      );
      const distanceToB = distance(
        pageCenter,
        withDroppableDisplacement(destination, b.page.withMargin.center)
      );

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
