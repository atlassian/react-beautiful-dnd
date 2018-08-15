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

  // Where the element actually is now.
  // Need to take into account the change of scroll in the droppable
  const currentCenter: Position = withDroppableScroll(
    home,
    pageBorderBoxCenter,
  );
  const isDisplacingForward: boolean =
    currentCenter[axis.line] < originalCenter[axis.line];

  const movement: DragMovement = previousImpact.movement;
  const map: DisplacementMap = movement.map;

  const group: ?GroupingImpact = getGroupingImpact({
    pageCenterWithDroppableScroll: currentCenter,
    draggable,
    destination: home,
    displaced: map,
    insideDestination: insideHome,
    direction: currentDirection,
    impact: previousImpact,
  });

  const isMovingForward: boolean = isUserMovingForward(
    currentDirection,
    home.axis,
  );
  console.log('is moving forward', isMovingForward);

  // not considering margin so that items move based on visible edges

  // TODO: if currentCenter === originalCenter can just abort

  // Amount to move needs to include the margins
  // const amount: Position = patch(
  //   axis.line,
  //   draggable.client.marginBox[axis.size],
  // );
  const modifier: number = movement.isBeyondStartPosition ? -1 : 1;
  const shift: number = movement.amount[axis.line] * modifier;

  const displaced: Displacement[] = insideHome
    .filter(
      (child: DraggableDimension): boolean => {
        // do not want to move the item that is dragging
        if (child === draggable) {
          return false;
        }

        const isDisplaced: boolean = Boolean(map[child.descriptor.id]);
        const shiftedBy: number = isDisplaced ? shift : 0;
        const borderBox: Rect = child.page.borderBox;
        const start: number = borderBox[axis.start] + shiftedBy;
        const end: number = borderBox[axis.end] + shiftedBy;

        // if (isDisplacingForward) {
        // }

        // if moving forward then the center position needs to be
        // greater that the start of the
        if (isMovingForward) {
          return currentCenter[axis.line] > start;
        }

        // moving backwards
        // The center of the draggable needs to be smaller than the
        // end of the thing behind it
        return currentCenter[axis.line] < end;

        // const

        // Maintain current displacement if grouping
        // if (group && child.descriptor.id === group.groupingWith.draggableId) {
        //   return isAlreadyDisplaced;
        // }

        // const borderBox: Rect = child.page.borderBox;

        if (isBeyondStartPosition) {
          // 1. item needs to start ahead of the moving item
          // 2. the dragging item has moved over it
          if (borderBox.center[axis.line] < originalCenter[axis.line]) {
            return false;
          }

          return currentCenter[axis.line] > borderBox[axis.start];
        }
        // moving backwards
        // 1. item needs to start behind the moving item
        // 2. the dragging item has moved over it
        if (originalCenter[axis.line] < borderBox.center[axis.line]) {
          return false;
        }

        return currentCenter[axis.line] < borderBox[axis.end];
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

  const isBeyondStartPosition: boolean =
    currentCenter[axis.line] > originalCenter[axis.line];

  // Need to ensure that we always order by the closest impacted item
  const ordered: Displacement[] = isBeyondStartPosition
    ? displaced.reverse()
    : displaced;
  const index: number = (() => {
    // const startIndex = insideHome.indexOf(draggable);
    const startIndex = draggable.descriptor.index;
    const length: number = ordered.length;
    if (!length) {
      return startIndex;
    }

    if (isBeyondStartPosition) {
      return startIndex + length;
    }
    // is moving backwards
    return startIndex - length;
  })();

  const newMovement: DragMovement = {
    amount: previousImpact.movement.amount,
    displaced: ordered,
    map: getDisplacementMap(ordered),
    isBeyondStartPosition,
  };

  const impact: DragImpact = {
    movement: newMovement,
    direction: axis.direction,
    destination: {
      droppableId: home.descriptor.id,
      index,
    },
    // TODO
    group,
  };

  return impact;
};
