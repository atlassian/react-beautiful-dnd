// @flow
import type { Rect, Position } from 'css-box-model';
import type {
  DraggableId,
  Axis,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  LiftEffect,
  DisplacedBy,
} from '../../types';
import { find } from '../../native-with-fallback';
import getDidStartAfterCritical from '../did-start-after-critical';
import getDisplacedBy from '../get-displaced-by';
import getIsDisplaced from '../get-is-displaced';
import removeDraggableFromList from '../remove-draggable-from-list';

type Args = {|
  draggable: DraggableDimension,
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  previousImpact: DragImpact,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  afterCritical: LiftEffect,
|};
export default ({
  draggable,
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  previousImpact,
  destination,
  insideDestination,
  afterCritical,
}: Args): ?DragImpact => {
  if (!destination.isCombineEnabled) {
    return null;
  }
  const axis: Axis = destination.axis;
  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
  );
  const displacement: number = displacedBy.value;

  const targetCenter: number = currentCenter[axis.line];
  const targetSize: number = draggable.client.borderBox[axis.size];
  const targetStart: number = targetCenter - targetSize / 2;
  const targetEnd: number = targetCenter + targetSize / 2;

  const withoutDragging: DraggableDimension[] = removeDraggableFromList(
    draggable,
    insideDestination,
  );

  const combineWith: ?DraggableDimension = find(
    withoutDragging,
    (child: DraggableDimension): boolean => {
      const id: DraggableId = child.descriptor.id;
      const childRect: Rect = child.page.borderBox;
      const childSize: number = childRect[axis.size];
      const threshold: number = childSize * (1 / 5);

      const didStartAfterCritical: boolean = getDidStartAfterCritical(
        id,
        afterCritical,
      );

      const isDisplaced: boolean = getIsDisplaced({
        displaced: previousImpact.displaced,
        id,
      });

      if (didStartAfterCritical) {
        // In original position
        // Will combine with item when between 1/3 and 2/3 of item
        if (isDisplaced) {
          return (
            targetEnd > childRect[axis.start] + threshold &&
            targetEnd < childRect[axis.end] - threshold
          );
        }

        // child is now 'displaced' backwards from where it started
        // want to combine when we move backwards onto it
        return (
          targetStart < childRect[axis.end] - displacement - threshold &&
          targetStart > childRect[axis.start] - displacement + threshold
        );
      }

      // has moved forwards
      if (isDisplaced) {
        return (
          targetStart < childRect[axis.end] - threshold &&
          targetStart > childRect[axis.start] + threshold
        );
      }

      // is in resting position - being moved backwards on to
      return (
        targetEnd > childRect[axis.start] + displacement + threshold &&
        targetEnd < childRect[axis.end] + displacement - threshold
      );
    },
  );

  if (!combineWith) {
    return null;
  }

  const impact: DragImpact = {
    // no change to displacement when combining
    displacedBy,
    displaced: previousImpact.displaced,
    at: {
      type: 'COMBINE',
      combine: {
        draggableId: combineWith.descriptor.id,
        droppableId: destination.descriptor.id,
      },
    },
  };
  return impact;
};
