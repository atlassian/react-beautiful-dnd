// @flow
import type { Rect, Position } from 'css-box-model';
import type {
  DraggableId,
  Axis,
  UserDirection,
  DraggableDimension,
  DroppableDimension,
  GroupingImpact,
  DragImpact,
  DisplacementMap,
} from '../../types';
import isWithin from '../is-within';
import isUserMovingForward from '../user-direction/is-user-moving-forward';

const getDirectionForDetection = (
  id: DraggableId,
  currentDirection: UserDirection,
  oldGroup: ?GroupingImpact,
): UserDirection => {
  if (!oldGroup) {
    return currentDirection;
  }
  if (id !== oldGroup.groupingWith.draggableId) {
    return currentDirection;
  }
  return oldGroup.whenEntered;
};

type IsGroupingWithArgs = {|
  id: DraggableId,
  currentCenter: Position,
  axis: Axis,
  borderBox: Rect,
  displacedBy: number,
  currentDirection: UserDirection,
  oldGroup: ?GroupingImpact,
|};

const isGroupingWith = ({
  id,
  currentCenter,
  axis,
  borderBox,
  displacedBy,
  currentDirection,
  oldGroup,
}: IsGroupingWithArgs): boolean => {
  const start: number = borderBox[axis.start] + displacedBy;
  const end: number = borderBox[axis.end] + displacedBy;
  const size: number = borderBox[axis.size];
  const oneThird: number = size * 0.333;

  const direction: UserDirection = getDirectionForDetection(
    id,
    currentDirection,
    oldGroup,
  );
  const isMovingForward: boolean = isUserMovingForward(axis, direction);

  // if moving forward then we will be hitting the start edge of the thing after us
  // if moving backwards we will be hitting the bottom edge of the thing behind us
  const adjustedStart: number = isMovingForward ? start : start + oneThird;
  const adjustedEnd: number = isMovingForward ? end - oneThird : end;

  return isWithin(adjustedStart, adjustedEnd)(currentCenter[axis.line]);
};

type Args = {|
  pageBorderBoxCenterWithDroppableScroll: Position,
  previousImpact: DragImpact,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  direction: UserDirection,
|};
export default ({
  pageBorderBoxCenterWithDroppableScroll: currentCenter,
  previousImpact,
  draggable,
  destination,
  insideDestination,
  direction,
}: Args): ?GroupingImpact => {
  if (!destination.isGroupingEnabled) {
    return null;
  }

  const axis: Axis = destination.axis;
  const map: DisplacementMap = previousImpact.movement.map;
  const canBeDisplacedBy: number = previousImpact.movement.displacedBy.value;
  const oldGroup: ?GroupingImpact = previousImpact.group;

  const target: ?DraggableDimension = insideDestination.find(
    (child: DraggableDimension): boolean => {
      // Cannot group with yourself
      const id: DraggableId = child.descriptor.id;
      if (id === draggable.descriptor.id) {
        return false;
      }

      const isDisplaced: boolean = Boolean(map[id]);
      const displacedBy: number = isDisplaced ? canBeDisplacedBy : 0;

      return isGroupingWith({
        id,
        currentCenter,
        axis,
        borderBox: child.page.borderBox,
        displacedBy,
        currentDirection: direction,
        oldGroup,
      });
    },
  );

  if (!target) {
    return null;
  }

  const result: GroupingImpact = {
    whenEntered: getDirectionForDetection(
      target.descriptor.id,
      direction,
      oldGroup,
    ),
    groupingWith: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id,
    },
  };
  return result;
};
