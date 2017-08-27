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
  draggables.sort((a: DraggableDimension, b: DraggableDimension) => (
    distance(center, add(a.page.withMargin.center, scrollOffset)) -
    distance(center, add(b.page.withMargin.center, scrollOffset))
  ))
  // If there is a tie, we want to go into the first slot on the main axis
  .sort((a: DraggableDimension, b: DraggableDimension) => (
    a.page.withMargin[axis.start] - b.page.withMargin[axis.start]
  ))[0];
