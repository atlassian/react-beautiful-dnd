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
import isWithin from '../is-within';
import { vertical } from '../axis';

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
  const movement: DragMovement = previousImpact.movement;
  const map: DisplacementMap = movement.map;
  const group: ?GroupingImpact = previousImpact.group;

  // Where the element actually is now.
  // Need to take into account the change of scroll in the droppable
  const currentCenter: Position = withDroppableScroll(
    home,
    pageBorderBoxCenter,
  );

  // Are we grouping?
  // const isGroupingEnabled: boolean = home.isGroupingEnabled;

  const direction: UserDirection = group ? group.whenEntered : currentDirection;

  const isMovingForward: boolean =
    axis === vertical
      ? direction.vertical === 'down'
      : direction.horizontal === 'right';

  // if (isGroupingEnabled)

  const modifier: number = movement.isBeyondStartPosition ? -1 : 1;
  const shift: number = movement.amount[axis.line] * modifier;

  // are we over the top over any draggable?
  const groupedWith: ?DraggableDimension = insideHome.find(
    (child: DraggableDimension): boolean => {
      // Cannot group with yourself
      if (child.descriptor.id === draggable.descriptor.id) {
        return false;
      }

      const isDisplaced: boolean = Boolean(map[child.descriptor.id]);
      // TODO: if already displaced then we need to account for that when grouping
      console.log('is already displaced!', isDisplaced);

      const localShift: number = isDisplaced ? shift : 0;

      const marginBox: Rect = child.page.marginBox;
      const start: number = marginBox[axis.start] + localShift;
      const end: number = marginBox[axis.end] + localShift;
      const size: number = marginBox[axis.size];
      const oneThird: number = size * 0.333;

      const adjustedStart: number = isMovingForward ? start : start + oneThird;
      const adjustedEnd: number = isMovingForward ? end - oneThird : end;

      const isOver = isWithin(adjustedStart, adjustedEnd);
      // const isOver = isWithin(start, end);

      return isOver(currentCenter[axis.line]);
    },
  );

  const newGroup: ?GroupingImpact = groupedWith
    ? {
        whenEntered: direction,
        groupingWith: {
          draggableId: groupedWith.descriptor.id,
          droppableId: home.descriptor.id,
        },
      }
    : null;

  if (groupedWith) {
    console.log('grouped with', groupedWith.descriptor.id);
  }

  // not considering margin so that items move based on visible edges
  const isBeyondStartPosition: boolean =
    currentCenter[axis.line] > originalCenter[axis.line];

  // TODO: if currentCenter === originalCenter can just abort

  // Amount to move needs to include the margins
  const amount: Position = patch(
    axis.line,
    draggable.client.marginBox[axis.size],
  );

  const displaced: Displacement[] = insideHome
    .filter(
      (child: DraggableDimension): boolean => {
        // do not want to move the item that is dragging
        if (child === draggable) {
          return false;
        }

        const isAlreadyDisplaced: boolean = Boolean(map[child.descriptor.id]);

        // do not want to move an item that is being groupedWith
        if (child === groupedWith) {
          return isAlreadyDisplaced;
        }

        const borderBox: Rect = child.page.borderBox;

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
    amount,
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
    group: newGroup,
  };

  return impact;
};
