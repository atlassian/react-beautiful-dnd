// @flow
import type {
  DraggableDimension,
  DroppableDimension,
  ClientRect,
} from '../types';

type Args = {|
  draggable: DraggableDimension,
  displaced: DraggableDimension,
  droppable: DroppableDimension,
  viewport: ClientRect,
|}

export default ({
  draggable,
  displaced,
  droppable,
  viewport,
}: Args): boolean => true;
