// @flow
import isPartiallyWithin from './is-partially-within';
import isPositionWithin from './is-position-within';
import { offset } from '../spacing';
import type {
  DroppableDimension,
  DraggableDimension,
  Position,
  Spacing,
} from '../../types';

export const isPositionVisible = (droppable: DroppableDimension) =>
  isPositionWithin(droppable.viewport.clipped);

export const isSpacingVisible = (droppable: DroppableDimension) => {
  const isVisible = isPartiallyWithin(droppable.viewport.clipped);
  const displacement: Position = droppable.viewport.frameScroll.diff.displacement;

  // Taking into account changes in the droppables scroll
  return (spacing: Spacing) => {
    const withScroll: Spacing = offset(spacing, displacement);

    return isVisible(withScroll);
  };
};

export const isDraggableVisible = (droppable: DroppableDimension) => {
  const isVisibleInClipped = isSpacingVisible(droppable);

  return (draggable: DraggableDimension): boolean => {
    const result = isVisibleInClipped(draggable.page.withoutMargin);

    return result;
  };
};

