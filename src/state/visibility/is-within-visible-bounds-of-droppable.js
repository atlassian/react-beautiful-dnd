// @flow
import { isSpacingPartiallyWithin, isPositionPartiallyWithin } from './is-partially-within';
import type {
  DroppableDimension,
  DraggableDimension,
} from '../../types';

export const isPositionVisible = (droppable: DroppableDimension) =>
  isPositionPartiallyWithin(droppable.viewport.clipped);

export const isSpacingVisible = (droppable: DroppableDimension) =>
  isSpacingPartiallyWithin(droppable.viewport.clipped);

export const isDraggableVisible = (droppable: DroppableDimension) => {
  const isVisibleInClipped = isSpacingVisible(droppable);

  return (draggable: DraggableDimension): boolean =>
    isVisibleInClipped(draggable.page.withoutMargin);
};

