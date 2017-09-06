// @flow
import { add, distance } from '../position';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import type {
  Axis,
  Position,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
} from '../../types';

type Args = {|
  axis: Axis,
  pageCenter: Position,
  // how far the destination Droppable is scrolled
  scrollOffset: Position,
  // the droppable that is being moved to
  destination: DroppableDimension,
  draggables: DraggableDimensionMap,
|}

// TODO
const isVisible = (draggable: DraggableDimension, droppable: DroppableDimension) => true;

export default ({
  axis,
  pageCenter,
  scrollOffset,
  destination,
  draggables,
}: Args): ?DraggableDimension => {
  const siblings: DraggableDimension[] = getDraggablesInsideDroppable(
    destination, draggables
  );

  const result: DraggableDimension[] =
    // remove any options that are hidden by overflow
    siblings
      .filter((draggable: DraggableDimension) => isVisible(draggable, destination))
      .sort((a: DraggableDimension, b: DraggableDimension): number => {
        // TODO: not considering scroll offset
        console.log('scroll offset', scrollOffset);
        const distanceToA = distance(pageCenter, a.page.withMargin.center);
        const distanceToB = distance(pageCenter, b.page.withMargin.center);

        // if a is closer - return a
        if (distanceToA < distanceToB) {
          return -1;
        }

        // if b is closer - return b
        if (distanceToB < distanceToA) {
          return 1;
        }

        // if the distance to a and b are the same:
        // return the one that appears first on the main axis
        return a.page.withMargin[axis.start] - b.page.withMargin[axis.start];
      });

  return result.length ? result[0] : null;
};
