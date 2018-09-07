// @flow
import type { DraggableDimension, DroppableDimension } from '../types';

export default (
  draggable: DraggableDimension,
  destination: DroppableDimension,
): boolean => draggable.descriptor.droppableId === destination.descriptor.id;
