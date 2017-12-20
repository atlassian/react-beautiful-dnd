// @flow
import type {
  DragMovement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
  Position,
  Displacement,
  Area,
} from '../../types';
import { add, patch } from '../position';
import getDisplacement from '../get-displacement';
import getViewport from '../visibility/get-viewport';

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
  const viewport: Area = getViewport();
  const axis: Axis = home.axis;
  const homeScrollDiff: Position = home.viewport.frameScroll.diff;
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

      const area: Area = child.page.withoutMargin;

      if (isBeyondStartPosition) {
        // 1. item needs to start ahead of the moving item
        // 2. the dragging item has moved over it
        if (area.center[axis.line] < originalCenter[axis.line]) {
          return false;
        }

        return currentCenter[axis.line] > area[axis.start];
      }
      // moving backwards
      // 1. item needs to start behind the moving item
      // 2. the dragging item has moved over it
      if (originalCenter[axis.line] < area.center[axis.line]) {
        return false;
      }

      return currentCenter[axis.line] < area[axis.end];
    })
    .map((dimension: DraggableDimension): Displacement => getDisplacement({
      draggable: dimension,
      destination: home,
      previousImpact,
      viewport,
    }));

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
