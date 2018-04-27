// @flow
import { type Position } from 'css-box-model';
import { distance } from '../position';
import { isTotallyVisible } from '../visibility/is-visible';
import withDroppableDisplacement from '../with-droppable-displacement';
import type {
  Viewport,
  Axis,
  DraggableDimension,
  DroppableDimension,
} from '../../types';

type Args = {|
  axis: Axis,
  viewport: Viewport,
  pageBorderBoxCenter: Position,
  // the droppable that is being moved to
  destination: DroppableDimension,
  // the droppables inside the destination
  insideDestination: DraggableDimension[],
|}

export default ({
  axis,
  viewport,
  pageBorderBoxCenter,
  destination,
  insideDestination,
}: Args): ?DraggableDimension => {
  // Empty list - bail out
  if (!insideDestination.length) {
    return null;
  }

  const result: DraggableDimension[] = insideDestination
    // Remove any options that are hidden by overflow
    // Draggable must be totally visible to move to it
    .filter((draggable: DraggableDimension): boolean =>
      isTotallyVisible({
        target: draggable.page.borderBox,
        destination,
        viewport: viewport.subject,
      }))
    .sort((a: DraggableDimension, b: DraggableDimension): number => {
      // Need to consider the change in scroll in the destination
      const distanceToA = distance(
        pageBorderBoxCenter,
        withDroppableDisplacement(destination, a.page.borderBox.center)
      );
      const distanceToB = distance(
        pageBorderBoxCenter,
        withDroppableDisplacement(destination, b.page.borderBox.center)
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
      return a.page.borderBox[axis.start] - b.page.borderBox[axis.start];
    });

  return result.length ? result[0] : null;
};
