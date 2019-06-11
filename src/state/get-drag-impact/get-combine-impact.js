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
  OnLift,
  DisplacedBy,
} from '../../types';
import isWithin from '../is-within';
import { find } from '../../native-with-fallback';
import isUserMovingForward from '../user-direction/is-user-moving-forward';
import getCombinedItemDisplacement from '../get-combined-item-displacement';
import removeDraggableFromList from '../remove-draggable-from-list';

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
  onLift: OnLift,
|};
export default ({
  draggable,
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  previousImpact,
  destination,
  insideDestination,
  userDirection,
  onLift,
}: Args): ?DragImpact => {
  if (!destination.isCombineEnabled) {
    return null;
  }

  const axis: Axis = destination.axis;
  const displaced: DisplacementGroups = previousImpact.displaced;
  const canBeDisplacedBy: DisplacedBy = previousImpact.displacedBy;
  const lastCombineImpact: ?CombineImpact = tryGetCombineImpact(previousImpact);

  const target: ?DraggableDimension = find(
    removeDraggableFromList(draggable, insideDestination),
    (child: DraggableDimension): boolean => {
      const id: DraggableId = child.descriptor.id;

      const displaceBy: Position = getCombinedItemDisplacement({
        displaced,
        onLift,
        combineWith: id,
        displacedBy: canBeDisplacedBy,
      });

      return isCombiningWith({
        id,
        currentCenter,
        axis,
        borderBox: child.page.borderBox,
        displaceBy,
        currentUserDirection: userDirection,
        lastCombineImpact,
      });
    },
  );

  if (!target) {
    return null;
  }

  // no change of displacement
  const impact: DragImpact = {
    displacedBy: previousImpact.displacedBy,
    displaced: previousImpact.displaced,
    at: {
      type: 'COMBINE',
      whenEntered: getWhenEntered(
        target.descriptor.id,
        userDirection,
        lastCombineImpact,
      ),
      combine: {
        draggableId: target.descriptor.id,
        droppableId: destination.descriptor.id,
      },
    },
  };
  return impact;
};
