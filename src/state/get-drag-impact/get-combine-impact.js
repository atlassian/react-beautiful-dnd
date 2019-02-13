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
  DisplacementMap,
  OnLift,
  DisplacedBy,
} from '../../types';
import isWithin from '../is-within';
import { find } from '../../native-with-fallback';
import isUserMovingForward from '../user-direction/is-user-moving-forward';
import getCombinedItemDisplacement from '../get-combined-item-displacement';

const getWhenEntered = (
  id: DraggableId,
  current: UserDirection,
  oldMerge: ?CombineImpact,
): UserDirection => {
  if (!oldMerge) {
    return current;
  }
  if (id !== oldMerge.combine.draggableId) {
    return current;
  }
  return oldMerge.whenEntered;
};

type IsCombiningWithArgs = {|
  id: DraggableId,
  currentCenter: Position,
  axis: Axis,
  borderBox: Rect,
  displaceBy: Position,
  currentUserDirection: UserDirection,
  oldMerge: ?CombineImpact,
|};

const isCombiningWith = ({
  id,
  currentCenter,
  axis,
  borderBox,
  displaceBy,
  currentUserDirection,
  oldMerge,
}: IsCombiningWithArgs): boolean => {
  const start: number = borderBox[axis.start] + displaceBy[axis.line];
  const end: number = borderBox[axis.end] + displaceBy[axis.line];
  const size: number = borderBox[axis.size];
  const twoThirdsOfSize: number = size * 0.666;

  const whenEntered: UserDirection = getWhenEntered(
    id,
    currentUserDirection,
    oldMerge,
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

type Args = {|
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  previousImpact: DragImpact,
  destination: DroppableDimension,
  insideDestinationWithoutDraggable: DraggableDimension[],
  userDirection: UserDirection,
  onLift: OnLift,
|};
export default ({
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  previousImpact,
  destination,
  insideDestinationWithoutDraggable,
  userDirection,
  onLift,
}: Args): ?DragImpact => {
  if (!destination.isCombineEnabled) {
    return null;
  }

  const axis: Axis = destination.axis;
  const map: DisplacementMap = previousImpact.movement.map;
  const canBeDisplacedBy: DisplacedBy = previousImpact.movement.displacedBy;
  const oldMerge: ?CombineImpact = previousImpact.merge;

  const target: ?DraggableDimension = find(
    insideDestinationWithoutDraggable,
    (child: DraggableDimension): boolean => {
      const id: DraggableId = child.descriptor.id;

      const displaceBy: Position = getCombinedItemDisplacement({
        displaced: map,
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
        oldMerge,
      });
    },
  );

  if (!target) {
    console.log('no target');
    return null;
  }

  const merge: CombineImpact = {
    whenEntered: getWhenEntered(target.descriptor.id, userDirection, oldMerge),
    combine: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id,
    },
  };

  // no change of displacement
  // clearing any destination
  const withMerge: DragImpact = {
    ...previousImpact,
    destination: null,
    merge,
  };
  return withMerge;
};
