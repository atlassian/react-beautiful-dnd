// @flow
import type {
  DragMovement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  DimensionFragment,
  Axis,
  Position,
  ClientRect,
  Displacement,
} from '../../types';
import { add, subtract, patch } from '../position';
import isDisplacedDraggableVisible from '../is-displaced-draggable-visible';
import getVisibleViewport from '../get-visible-viewport';

// It is the responsibility of this function
// to return the impact of a drag

type Args = {|
  pageCenter: Position,
  draggable: DraggableDimension,
  home: DroppableDimension,
  insideHome: DraggableDimension[],
|}

export default ({
  pageCenter,
  draggable,
  home,
  insideHome,
}: Args): DragImpact => {
  const viewport: ClientRect = getVisibleViewport();
  // console.log('viewport', viewport);

  const axis: Axis = home.axis;
  const homeScrollDiff: Position = subtract(
    home.container.scroll.current, home.container.scroll.initial
  );
  // Where the element actually is now
  const currentCenter: Position = add(pageCenter, homeScrollDiff);
  // The starting center position
  const originalCenter: Position = draggable.page.withoutMargin.center;

  // not considering margin so that items move based on visible edges
  const isBeyondStartPosition: boolean = currentCenter[axis.line] - originalCenter[axis.line] > 0;

  const moved: Displacement[] = insideHome
    .filter((child: DraggableDimension): boolean => {
      // do not want to move the item that is dragging
      if (child === draggable) {
        return false;
      }

      const fragment: DimensionFragment = child.page.withoutMargin;

      if (isBeyondStartPosition) {
        // 1. item needs to start ahead of the moving item
        // 2. the dragging item has moved over it
        if (fragment.center[axis.line] < originalCenter[axis.line]) {
          return false;
        }

        return currentCenter[axis.line] > fragment[axis.start];
      }
      // moving backwards
      // 1. item needs to start behind the moving item
      // 2. the dragging item has moved over it
      if (originalCenter[axis.line] < fragment.center[axis.line]) {
        return false;
      }

      return currentCenter[axis.line] < fragment[axis.end];
    })
    .filter((dimension: DraggableDimension) => {
      const result = isDisplacedDraggableVisible({
        draggable,
        displaced: dimension,
        droppable: home,
        viewport,
      });
      return result;
    })
    .map((dimension: DraggableDimension): Displacement => ({
      draggableId: dimension.descriptor.id,
      shouldAnimate: false,
    }));

  // Need to ensure that we always order by the closest impacted item
  const ordered: Displacement[] = isBeyondStartPosition ? moved.reverse() : moved;

  const index: number = (() => {
    const startIndex = insideHome.indexOf(draggable);
    if (!moved.length) {
      return startIndex;
    }

    if (isBeyondStartPosition) {
      return startIndex + moved.length;
    }
    // is moving backwards
    return startIndex - moved.length;
  })();

  const movement: DragMovement = {
    amount: patch(axis.line, draggable.client.withMargin[axis.size]),
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
  };

  return impact;
};
