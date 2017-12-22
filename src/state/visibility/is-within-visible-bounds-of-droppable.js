// @flow
import isPartiallyWithin from './is-partially-within';
import isPositionWithin from './is-position-within';
import { offset } from '../spacing';
import { add } from '../position';
import type {
  DroppableDimension,
  DraggableDimension,
  Position,
  Spacing,
} from '../../types';

export const isPositionVisible = (droppable: DroppableDimension) => {
  const isVisible = isPositionWithin(droppable.viewport.clipped);
  const displacement: Position = droppable.viewport.frameScroll.diff.displacement;

  return (point: Position) => {
    // Taking into account changes in the droppables scroll
    const withScroll: Position = add(point, displacement);

    return isVisible(withScroll);
  };
};

export const isSpacingVisible = (droppable: DroppableDimension) => {
  const isVisible = isPartiallyWithin(droppable.viewport.clipped);
  const displacement: Position = droppable.viewport.frameScroll.diff.displacement;

  return (spacing: Spacing) => {
    // Taking into account changes in the droppables scroll
    const withScroll: Spacing = offset(spacing, displacement);

    return isVisible(withScroll);
  };
};

export const isDraggableVisible = (droppable: DroppableDimension) => {
  const isVisible = isSpacingVisible(droppable);

  return (draggable: DraggableDimension): boolean =>
    isVisible(draggable.page.withoutMargin);
};

