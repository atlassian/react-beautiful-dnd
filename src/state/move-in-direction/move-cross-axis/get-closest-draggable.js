// @flow
import { type Position, type Rect, type Spacing } from 'css-box-model';
import type {
  Viewport,
  DraggableDimension,
  DroppableDimension,
  OnLift,
} from '../../../types';
import { distance, negate, subtract } from '../../position';
import { isTotallyVisible } from '../../visibility/is-visible';
import withDroppableDisplacement from '../../with-scroll-change/with-droppable-displacement';
import { offsetByPosition } from '../../spacing';
import didStartDisplaced from '../../starting-displaced/did-start-displaced';

const removeStartingDisplacementFromCenter = (
  draggable: DraggableDimension,
  onLift: OnLift,
): Position => {
  const original: Position = draggable.page.borderBox.center;
  return didStartDisplaced(draggable.descriptor.id, onLift)
    ? subtract(original, onLift.displacedBy.point)
    : original;
};

const removeStartingDisplacementFromBorderBox = (
  draggable: DraggableDimension,
  onLift: OnLift,
): Spacing => {
  const original: Rect = draggable.page.borderBox;

  // If we are moving back into the home list then all the
  // items will be visibly displaced backwards
  return didStartDisplaced(draggable.descriptor.id, onLift)
    ? offsetByPosition(original, negate(onLift.displacedBy.point))
    : original;
};

type Args = {|
  pageBorderBoxCenter: Position,
  viewport: Viewport,
  // the droppable that is being moved to
  destination: DroppableDimension,
  // the droppables inside the destination
  insideDestination: DraggableDimension[],
  onLift: OnLift,
|};

export default ({
  pageBorderBoxCenter,
  viewport,
  destination,
  insideDestination,
  onLift,
}: Args): ?DraggableDimension => {
  const sorted: DraggableDimension[] = insideDestination
    .filter(
      (draggable: DraggableDimension): boolean =>
        // Allowing movement to draggables that are not visible in the viewport
        // but must be visible in the droppable
        // We can improve this, but this limitation is easier for now
        isTotallyVisible({
          target: removeStartingDisplacementFromBorderBox(draggable, onLift),
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
          withDroppableDisplacement(
            destination,
            removeStartingDisplacementFromCenter(a, onLift),
          ),
        );
        const distanceToB = distance(
          pageBorderBoxCenter,
          withDroppableDisplacement(
            destination,
            removeStartingDisplacementFromCenter(b, onLift),
          ),
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
        // return the one with the lower index (it will be higher on the main axis)
        return a.descriptor.index - b.descriptor.index;
      },
    );

  return sorted[0] || null;
};
