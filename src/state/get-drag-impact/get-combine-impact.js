// @flow
import type { Rect, Position } from 'css-box-model';
import type {
  DraggableId,
  Axis,
  UserDirection,
  DraggableDimension,
  DroppableDimension,
  CombineImpact,
  DragImpact,
  DisplacementGroups,
  LiftEffect,
  DisplacedBy,
} from '../../types';
import isWithin from '../is-within';
import { find } from '../../native-with-fallback';
import isUserMovingForward from '../user-direction/is-user-moving-forward';
import getCombinedItemDisplacement from '../get-combined-item-displacement';
import removeDraggableFromList from '../remove-draggable-from-list';
import calculateCombineImpact from '../calculate-drag-impact/calculate-combine-impact';
import getDisplacedBy from '../get-displaced-by';
import getDidStartAfterCritical from '../did-start-after-critical';
import getIsDisplaced from '../get-is-displaced';

function getWhenEntered(
  id: DraggableId,
  current: UserDirection,
  lastCombineImpact: ?CombineImpact,
): UserDirection {
  if (!lastCombineImpact) {
    return current;
  }
  if (id !== lastCombineImpact.combine.draggableId) {
    return current;
  }
  return lastCombineImpact.whenEntered;
}

type IsCombiningWithArgs = {|
  id: DraggableId,
  currentCenter: Position,
  axis: Axis,
  borderBox: Rect,
  displaceBy: Position,
  currentUserDirection: UserDirection,
  lastCombineImpact: ?CombineImpact,
|};

const isCombiningWith = ({
  id,
  currentCenter,
  axis,
  borderBox,
  displaceBy,
  currentUserDirection,
  lastCombineImpact,
}: IsCombiningWithArgs): boolean => {
  const start: number = borderBox[axis.start] + displaceBy[axis.line];
  const end: number = borderBox[axis.end] + displaceBy[axis.line];
  const size: number = borderBox[axis.size];
  const twoThirdsOfSize: number = size * 0.666;

  const whenEntered: UserDirection = getWhenEntered(
    id,
    currentUserDirection,
    lastCombineImpact,
  );
  const isMovingForward: boolean = isUserMovingForward(axis, whenEntered);
  const targetCenter: number = currentCenter[axis.line];

  if (isMovingForward) {
    // combine when moving in the front 2/3 of the item
    return isWithin(start, start + twoThirdsOfSize)(targetCenter);
  }
  // combine when moving in the back 2/3 of the item
  return isWithin(end - twoThirdsOfSize, end)(targetCenter);
};

function tryGetCombineImpact(impact: DragImpact): ?CombineImpact {
  if (impact.at && impact.at.type === 'COMBINE') {
    return impact.at;
  }
  return null;
}

type Args = {|
  draggable: DraggableDimension,
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  previousImpact: DragImpact,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  userDirection: UserDirection,
  afterCritical: LiftEffect,
|};
export default ({
  draggable,
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  previousImpact,
  destination,
  insideDestination,
  userDirection,
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
      const threshold: number = childSize * (1 / 6);

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
            targetEnd >= childRect[axis.start] + threshold &&
            targetEnd <= childRect[axis.end] - threshold
          );
        }

        // child is now 'displaced' backwards from where it started
        // want to combine when we move backwards onto it
        return (
          targetStart <= childRect[axis.end] - displacement - threshold &&
          targetStart >= childRect[axis.start] - displacement + threshold
        );
      }

      // has moved forwards
      if (isDisplaced) {
        return (
          targetStart <= childRect[axis.end] - threshold &&
          targetStart >= childRect[axis.start] + threshold
        );
      }

      // is in resting position - being moved backwards on to
      return (
        targetEnd >= childRect[axis.start] + displacement + threshold &&
        targetEnd <= childRect[axis.end] + displacement - threshold
      );
    },
  );

  if (!combineWith) {
    return null;
  }

  return calculateCombineImpact({
    combineWithId: combineWith.descriptor.id,
    destinationId: destination.descriptor.id,
    previousImpact,
    userDirection,
  });
};
