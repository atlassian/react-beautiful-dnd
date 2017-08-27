// @flow
import { distance } from '../position';
import type {
  Axis,
  Position,
  DraggableDimension,
} from '../../types';

type Args = {|
  axis: Axis,
  center: Position,
  draggables: DraggableDimension[],
|}

export default ({
  axis,
  center,
  draggables,
}: Args): DraggableDimension =>
  draggables.sort((a: DraggableDimension, b: DraggableDimension) => (
    distance(center, a.page.withMargin.center) -
    distance(center, b.page.withMargin.center)
  ))
  // If there is a tie, we want to go into the first slot on the main axis
  .sort((a: DraggableDimension, b: DraggableDimension) => (
    a.page.withMargin[axis.start] - b.page.withMargin[axis.start]
  ))[0];
