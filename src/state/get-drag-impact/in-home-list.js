// @flow
import { type Position, type Rect } from 'css-box-model';
import type {
  DragMovement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  GroupingImpact,
  Axis,
  Displacement,
  Viewport,
  UserDirection,
  DisplacementMap,
} from '../../types';
import { patch } from '../position';
import getDisplacement from '../get-displacement';
import getDisplacementMap from '../get-displacement-map';
import withDroppableScroll from '../with-droppable-scroll';
import getGroupingImpact from './get-grouping-impact';
import isUserMovingForward from '../is-user-moving-forward';

// It is the responsibility of this function
// to return the impact of a drag

let logCount = 0;

type Args = {|
  pageBorderBoxCenter: Position,
  draggable: DraggableDimension,
  home: DroppableDimension,
  insideHome: DraggableDimension[],
  previousImpact: DragImpact,
  viewport: Viewport,
  direction: UserDirection,
|};

export default ({
  pageBorderBoxCenter,
  draggable,
  home,
  insideHome,
  previousImpact,
  viewport,
  direction: currentDirection,
}: Args): DragImpact => {
  const axis: Axis = home.axis;
  // The starting center position
  const originalCenter: Position = draggable.page.borderBox.center;
  const amount: Position = patch(
    axis.line,
    draggable.client.marginBox[axis.size],
  );

  // Where the element actually is now.
  // Need to take into account the change of scroll in the droppable
  const currentCenter: Position = withDroppableScroll(
    home,
    pageBorderBoxCenter,
  );

  const isInFrontOfStart: boolean =
    currentCenter[axis.line] > originalCenter[axis.line];

  const isMovingForward: boolean = isUserMovingForward(
    currentDirection,
    home.axis,
  );
  const isMovingTowardStart: boolean = isInFrontOfStart
    ? !isMovingForward
    : isMovingForward;

  console.group(`execution: ${++logCount}`);
  console.log('isInFrontOfStart', isInFrontOfStart);
  console.log('isMovingForward', isMovingForward);
  console.log('isMovingTowardStart', isMovingTowardStart);

  const movement: DragMovement = previousImpact.movement;
  const map: DisplacementMap = movement.map;
  const modifier: number = movement.isBeyondStartPosition ? -1 : 1;
  const displacement: number = amount[axis.line] * modifier;
  // console.log('possible displacement', displacedBy);

  const displaced: Displacement[] = insideHome
    .filter(
      (child: DraggableDimension): boolean => {
        // do not want to displace the item that is dragging
        if (child === draggable) {
          return false;
        }

        const borderBox: Rect = child.page.borderBox;

        // If in front of where we started:
        // Nothing behind start can be displaced
        if (isInFrontOfStart) {
          if (borderBox.center[axis.line] < originalCenter[axis.line]) {
            return false;
          }
        }

        // If behind of where we started:
        // Nothing in front of start can be displaced
        if (!isInFrontOfStart) {
          if (borderBox.center[axis.line] > originalCenter[axis.line]) {
            return false;
          }
        }

        // At this point we know that the draggable could be displaced
        const isDisplaced: boolean = Boolean(map[child.descriptor.id]);
        const displacedBy: number = isDisplaced ? displacement : 0;
        const start: number = borderBox[axis.start];
        const end: number = borderBox[axis.end];

        if (isInFrontOfStart) {
          // Moving backwards towards the starting location
          // Need to check if the center is going over the
          // end edge of the target
          // Can reduce the amount of things that are displaced
          if (isMovingTowardStart) {
            return currentCenter[axis.line] > end + displacedBy;
          }

          // if was displaced and continuing to move away then will continue to be displaced
          if (isDisplaced) {
            return true;
          }

          // Moving forwards away from the starting location
          // Need to check if the center is going over the
          // start edge of the target
          // Can increase the amount of things that are displaced
          return currentCenter[axis.line] > start;
        }

        // is behind where we started

        // Moving back towards the starting location
        // Can reduce the amount of things displaced
        if (isMovingTowardStart) {
          return currentCenter[axis.line] < start + displacedBy;
        }

        // Continuing to move further away backwards from the start
        // Can increase the amount of things that are displaced
        if (isDisplaced) {
          return true;
        }
        // Shift once the center goes over the end of the thing before it
        return currentCenter[axis.line] < end;
      },
    )
    .map(
      (dimension: DraggableDimension): Displacement =>
        getDisplacement({
          draggable: dimension,
          destination: home,
          previousImpact,
          viewport: viewport.frame,
        }),
    );

  // Need to ensure that we always order by the closest impacted item
  const ordered: Displacement[] = isInFrontOfStart
    ? displaced.reverse()
    : displaced;
  const index: number = (() => {
    // const startIndex = insideHome.indexOf(draggable);
    const startIndex = draggable.descriptor.index;
    const length: number = ordered.length;
    if (!length) {
      return startIndex;
    }

    if (isInFrontOfStart) {
      return startIndex + length;
    }
    // is moving backwards
    return startIndex - length;
  })();

  const newMovement: DragMovement = {
    amount,
    displaced: ordered,
    map: getDisplacementMap(ordered),
    isBeyondStartPosition: isInFrontOfStart,
  };

  const impact: DragImpact = {
    movement: newMovement,
    direction: axis.direction,
    destination: {
      droppableId: home.descriptor.id,
      index,
    },
    // TODO
    group: null,
  };

  console.log('displaced', ordered.map(d => d.draggableId), ordered);
  console.groupEnd();

  return impact;
};
