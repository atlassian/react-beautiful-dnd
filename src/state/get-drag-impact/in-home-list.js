// @flow
import type {
  DraggableId,
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
  previousImpact: DragImpact,
|}

export default ({
  pageCenter,
  draggable,
  home,
  insideHome,
  previousImpact,
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

  const amount: Position = patch(axis.line, draggable.client.withMargin[axis.size]);

  const displaced: Displacement[] = insideHome
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
    .map((dimension: DraggableDimension): Displacement => {
      const id: DraggableId = dimension.descriptor.id;

      const isVisible: boolean = isDisplacedDraggableVisible({
        displaced: dimension,
        droppable: home,
        viewport,
      });

      const shouldAnimate: boolean = (() => {
        // if should be displaced and not visible
        if (!isVisible) {
          return false;
        }

        // see if we can find a previous value
        const previous: ?Displacement = previousImpact.movement.displaced.filter(
          (item: Displacement) => item.draggableId === id
        )[0];

        // if visible and no previous entries: animate!
        if (!previous) {
          return true;
        }

        // return our previous value
        // for items that where originally not visible this will be false
        // otherwise it will be true
        return previous.shouldAnimate;
      })();

      const displacement: Displacement = {
        draggableId: id,
        isVisible,
        shouldAnimate,
      };

      return displacement;
    });
  // Need to ensure that we always order by the closest impacted item
  const ordered: Displacement[] = isBeyondStartPosition ? displaced.reverse() : displaced;
  const index: number = (() => {
    const startIndex = insideHome.indexOf(draggable);
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
  };

  return impact;
};
