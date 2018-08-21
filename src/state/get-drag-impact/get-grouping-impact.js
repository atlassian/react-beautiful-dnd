// @flow
import type { Rect, Position } from 'css-box-model';
import type {
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

type GetBoundariesArgs = {||};

type Boundaries = {|
  start: number,
  end: number,
|};

const getBoundaries = {};

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
  const isMovingForward: boolean = isUserMovingForward(axis, direction);

  const target: ?DraggableDimension = insideDestination.find(
    (child: DraggableDimension): boolean => {
      // Cannot group with yourself
      if (child.descriptor.id === draggable.descriptor.id) {
        return false;
      }

      const isDisplaced: boolean = Boolean(map[child.descriptor.id]);
      const displacedBy: number = isDisplaced ? canBeDisplacedBy : 0;

      const borderBox: Rect = child.page.borderBox;
      const start: number = borderBox[axis.start] + displacedBy;
      const end: number = borderBox[axis.end] + displacedBy;

      const isOver = isWithin(start, end);

      return isOver(currentCenter[axis.line]);
    },
  );

  if (!target) {
    return null;
  }

  const result: GroupingImpact = {
    whenEntered: direction,
    groupingWith: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id,
    },
  };
  return result;
};
