// @flow
import { add, distance } from '../position';
import getViewport from '../visibility/get-viewport';
import { isTotallyVisible } from '../visibility/is-visible';
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

const origin: Position = { x: 0, y: 0 };

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
  const scrollDisplacement: Position = destination.viewport.closestScrollable ?
    destination.viewport.closestScrollable.scroll.diff.displacement :
    origin;

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
      const distanceToA = distance(pageCenter, add(a.page.withMargin.center, scrollDisplacement));
      const distanceToB = distance(pageCenter, add(b.page.withMargin.center, scrollDisplacement));

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
