// @flow
import { distance } from '../position';
import isWithin from '../is-within';
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

  const isWithinMainAxis = isWithin(
    destination.page.withoutMargin[axis.start],
    destination.page.withoutMargin[axis.end]
  );

  const result: DraggableDimension[] = insideDestination
      // Remove any options that are hidden by overflow
      // Whole draggable must be visible to move to it
      .filter((draggable: DraggableDimension) => (
        isWithinMainAxis(draggable.page.withoutMargin[axis.start]) &&
        isWithinMainAxis(draggable.page.withoutMargin[axis.end])
      ))
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
