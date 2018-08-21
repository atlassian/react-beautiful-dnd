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
  if (oldGroup.groupingWith === id) {
    return oldGroup.whenEntered;
  }
  return currentDirection;
};

type GetBoundariesArgs = {|
  id: DraggableId,
  axis: Axis,
  borderBox: Rect,
  displacedBy: number,
  currentDirection: UserDirection,
  oldGroup: ?GroupingImpact,
|};

type Boundaries = {|
  start: number,
  end: number,
|};

const getBoundaries = ({
  id,
  axis,
  borderBox,
  displacedBy,
  currentDirection,
  oldGroup,
}: GetBoundariesArgs): Boundaries => {
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

  const adjustedStart: number = isMovingForward ? start : start + oneThird;
  const adjustedEnd: number = isMovingForward ? end - oneThird : end;

  console.group('check');
  console.log('current direction', currentDirection);
  console.log('using direction', direction);
  console.log('start', start);
  console.log('adjustedStart', adjustedStart);
  console.log('end', end);
  console.log('adjustedEnd', adjustedEnd);
  console.log('when entered', oldGroup ? oldGroup.whenEntered : null);
  console.groupEnd();

  return { start: adjustedStart, end: adjustedEnd };
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

      const { start, end } = getBoundaries({
        id,
        axis,
        borderBox: child.page.borderBox,
        displacedBy,
        currentDirection: direction,
        oldGroup,
      });

      const isOver = isWithin(start, end);

      return isOver(currentCenter[axis.line]);
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
