// @flow
import { type Position, type Rect } from 'css-box-model';
import type {
  DragMovement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
  Displacement,
  Viewport,
  UserDirection,
} from '../../types';
import { patch } from '../position';
import getDisplacement from '../get-displacement';
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

  // Where the element actually is now.
  // Need to take into account the change of scroll in the droppable
  const currentCenter: Position = withDroppableScroll(
    home,
    pageBorderBoxCenter,
  );

  // Are we grouping?
  // const isGroupingEnabled: boolean = home.isGroupingEnabled;

  const direction: UserDirection = previousImpact.group
    ? previousImpact.group.whenEntered
    : currentDirection;

  const isMovingForward: boolean =
    axis === vertical
      ? direction.vertical === 'down'
      : direction.horizontal === 'right';

  // if (isGroupingEnabled) {
  // are we over the top over any draggable?
  const groupedWith: ?DraggableDimension = insideHome.find(
    (child: DraggableDimension): boolean => {
      // Cannot group with yourself
      if (child.descriptor.id === draggable.descriptor.id) {
        return false;
      }

      const marginBox: Rect = child.page.marginBox;
      const start: number = marginBox[axis.start];
      const end: number = marginBox[axis.end];
      const size: number = marginBox[axis.size];
      const oneThird: number = size * 0.333;

      const adjustedStart: number = isMovingForward ? start : start + oneThird;
      const adjustedEnd: number = isMovingForward ? end - oneThird : end;

      const isOver = isWithin(adjustedStart, adjustedEnd);

      return isOver(currentCenter[axis.line]);
    },
  );

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

  const movement: DragMovement = {
    amount,
    displaced: ordered,
    isBeyondStartPosition,
  };

  const impact: DragImpact = {
    movement,
    direction: axis.direction,
    destination: {
      droppableId: home.descriptor.id,
      index,
    },
    // TODO
    group: null,
  };

  return impact;
};
