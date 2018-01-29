// @flow
import { distance } from '../position';
import getViewport from '../visibility/get-viewport';
import { isPartiallyVisible } from '../visibility/is-visible';
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
    // Draggable must be partially visible to move to it
    .filter((draggable: DraggableDimension): boolean =>
      isPartiallyVisible({
        target: draggable.page.withMargin,
        destination,
        viewport,
      }).isVisible)
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
