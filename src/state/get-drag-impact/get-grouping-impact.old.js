// @flow
import { type Rect, type Position } from 'css-box-model';
import type {
  DragMovement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  GroupingImpact,
  Axis,
  UserDirection,
  DisplacementMap,
} from '../../types';
import { vertical } from '../axis';
import isWithin from '../is-within';

type Args = {|
  pageCenterWithDroppableScroll: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  displaced: DisplacementMap,
  impact: DragImpact,
  insideDestination: DraggableDimension[],
  direction: UserDirection,
|};

export default ({
  pageCenterWithDroppableScroll: currentCenter,
  draggable,
  destination,
  displaced,
  insideDestination,
  direction: currentDirection,
  impact,
}: Args): ?GroupingImpact => {
  const axis: Axis = destination.axis;
  const movement: DragMovement = impact.movement;
  const direction: UserDirection = impact.group
    ? impact.group.whenEntered
    : currentDirection;

  const isMovingForward: boolean =
    axis === vertical
      ? direction.vertical === 'down'
      : direction.horizontal === 'right';

  const modifier: number = movement.isInFrontOfStart ? -1 : 1;
  const shift: number = movement.amount[axis.line] * modifier;

  // TODO!\
  return null;

  const target: ?DraggableDimension = insideDestination.find(
    (child: DraggableDimension): boolean => {
      // Cannot group with yourself
      if (child.descriptor.id === draggable.descriptor.id) {
        return false;
      }

      const isDisplaced: boolean = Boolean(displaced[child.descriptor.id]);
      // TODO: if already displaced then we need to account for that when grouping

      const shiftedBy: number = isDisplaced ? shift : 0;

      const marginBox: Rect = child.page.marginBox;
      const start: number = marginBox[axis.start] + shiftedBy;
      const end: number = marginBox[axis.end] + shiftedBy;
      const size: number = marginBox[axis.size];
      const oneThird: number = size * 0.33333;
      console.group('shift');
      console.log('shifted by', shiftedBy);
      console.log('start', marginBox[axis.start]);
      console.log('start(shifted)', start);
      console.log('end', marginBox[axis.end]);
      console.log('end(shifted)', end);
      console.log('target', currentCenter[axis.line]);

      const adjustedStart: number = isMovingForward ? start : start + oneThird;
      const adjustedEnd: number = isMovingForward ? end - oneThird : end;

      const isOver = isWithin(adjustedStart, adjustedEnd);
      // const isOver = isWithin(start, end);

      console.log('isOver', isOver(currentCenter[axis.line]));
      console.groupEnd();
      return isOver(currentCenter[axis.line]);
    },
  );

  if (!target) {
    return null;
  }

  return {
    whenEntered: direction,
    groupingWith: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id,
    },
  };
};
