// @flow
import { type Position } from 'css-box-model';
import { distance } from '../../position';
import { isTotallyVisible } from '../../visibility/is-visible';
import withDroppableDisplacement from '../../with-scroll-change/with-droppable-displacement';
import type {
  Viewport,
  Axis,
  DraggableDimension,
  DroppableDimension,
} from '../../../types';

type Args = {|
  axis: Axis,
  pageBorderBoxCenter: Position,
  viewport: Viewport,
  // the droppable that is being moved to
  destination: DroppableDimension,
  // the droppables inside the destination
  insideDestination: DraggableDimension[],
|};

export default ({
  axis,
  pageBorderBoxCenter,
  viewport,
  destination,
  insideDestination,
}: Args): ?DraggableDimension => {
  const sorted: DraggableDimension[] = insideDestination
    .filter(
      (draggable: DraggableDimension): boolean =>
        // Allowing movement to draggables that are not visible in the viewport
        // but must be visible in the droppable
        // We can improve this, but this limitation is easier for now
        isTotallyVisible({
          target: draggable.page.borderBox,
          destination,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
    )
    .sort(
      (a: DraggableDimension, b: DraggableDimension): number => {
        // Need to consider the change in scroll in the destination
        const distanceToA = distance(
          pageBorderBoxCenter,
          withDroppableDisplacement(destination, a.page.borderBox.center),
        );
        const distanceToB = distance(
          pageBorderBoxCenter,
          withDroppableDisplacement(destination, b.page.borderBox.center),
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
      },
    );

  return sorted[0] || null;
};
