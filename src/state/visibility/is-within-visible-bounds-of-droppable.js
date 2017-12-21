// @flow
import isPartiallyWithin from './is-partially-within';
import isPositionWithin from './is-position-within';
import type {
  DroppableDimension,
  DraggableDimension,
} from '../../types';

export const isPositionVisible = (droppable: DroppableDimension) =>
  isPositionWithin(droppable.viewport.clipped);

export const isSpacingVisible = (droppable: DroppableDimension) =>
  isPartiallyWithin(droppable.viewport.clipped);

export const isDraggableVisible = (droppable: DroppableDimension) => {
  const isVisibleInClipped = isSpacingVisible(droppable);

  return (draggable: DraggableDimension): boolean =>
    isVisibleInClipped(draggable.page.withoutMargin);
};

