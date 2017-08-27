// @flow
import { add, distance } from '../position';
import type {
  Axis,
  Position,
  DraggableDimension,
} from '../../types';

type Args = {|
  axis: Axis,
  center: Position,
  // how far the destination Droppable is scrolled
  scrollOffset: Position,
  draggables: DraggableDimension[],
|}

export default ({
  axis,
  center,
  scrollOffset,
  draggables,
}: Args): DraggableDimension =>
  draggables.sort((a: DraggableDimension, b: DraggableDimension): number => {
    const distanceToA = distance(center, add(a.page.withMargin.center, scrollOffset));
    const distanceToB = distance(center, add(b.page.withMargin.center, scrollOffset));

    // if a is closer - return a
    if (distanceToA > distanceToB) {
      return -1;
    }

    // if b is closer - return b
    if (distanceToB < distanceToA) {
      return 1;
    }

    // if the distance to a and b are the same:
    // return the one that appears first on the main axis
    return a.page.withMargin[axis.start] - b.page.withMargin[axis.start];
  })[0];
