// @flow
import isWithin from '../is-within';
import type {
  Position,
  DroppableDimension,
  DimensionFragment,
  DraggableDimension,
  Spacing,
} from '../../types';

export const isPositionVisible = (droppable: DroppableDimension) => {
  const clipped: DimensionFragment = droppable.viewport.clipped;

  const isWithinHorizontal = isWithin(clipped.left, clipped.right);
  const isWithinVertical = isWithin(clipped.top, clipped.bottom);

  return (point: Position): boolean => (
    isWithinHorizontal(point.x) &&
    isWithinVertical(point.y)
  );
};

export const isSpacingVisible = (droppable: DroppableDimension) => {
  const clipped: DimensionFragment = droppable.viewport.clipped;

  const isWithinHorizontal = isWithin(clipped.left, clipped.right);
  const isWithinVertical = isWithin(clipped.top, clipped.bottom);

  return (spacing: Spacing): boolean => (
    isWithinHorizontal(spacing.left) &&
    isWithinHorizontal(spacing.right) &&
    isWithinVertical(spacing.top) &&
    isWithinVertical(spacing.bottom)
  );
};

export const isDraggableVisible = (droppable: DroppableDimension) => {
  const isVisibleInClipped = isSpacingVisible(droppable);

  return (draggable: DraggableDimension): boolean =>
    isVisibleInClipped(draggable.page.withoutMargin);
};

