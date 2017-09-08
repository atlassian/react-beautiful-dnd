// @flow
import { add, distance, patch, subtract } from '../position';
import isWithin from '../is-within';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import type {
  Axis,
  Position,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
} from '../../types';

type Args = {|
  axis: Axis,
  pageCenter: Position,
  // the droppable that is being moved to
  destination: DroppableDimension,
  draggables: DraggableDimensionMap,
|}

export default ({
  axis,
  pageCenter,
  destination,
  draggables,
}: Args): ?DraggableDimension => {
  const options: DraggableDimension[] = getDraggablesInsideDroppable(
    destination, draggables
  );

  // Empty list - bail out
  if (!options.length) {
    return null;
  }

  const isWithinMainAxis = isWithin(
    destination.page.withMargin[axis.start],
    destination.page.withMargin[axis.end]
  );

  const result: DraggableDimension[] = options
      // Remove any options that are hidden by overflow
      // Whole draggable must be visible to move to it
      .filter((draggable: DraggableDimension) =>
        isWithinMainAxis(draggable.page.withMargin[axis.start]) &&
        isWithinMainAxis(draggable.page.withMargin[axis.end])
      )
      .sort((a: DraggableDimension, b: DraggableDimension): number => {
        // TODO: not considering scroll offset
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
