// @flow
import isWithin from './is-within';
import type {
  Position,
  DraggableDimension,
  DroppableDimension,
  DimensionFragment,
  Spacing,
} from '../types';

const isPointWithin = (bounds: Spacing) => {
  const isWithinHorizontal = isWithin(bounds.left, bounds.right);
  const isWithinVertical = isWithin(bounds.top, bounds.bottom);

  return (point: Position): boolean => (
    isWithinHorizontal(point.x) &&
    isWithinVertical(point.y)
  );
};

export const isPointWithinDroppable = (droppable: DroppableDimension) => (
  isPointWithin(droppable.viewport.clipped)
);

export const isDraggableWithin = (bounds: Spacing) => {
  const { top, right, bottom, left } = bounds;

  // There are some extremely minor inaccuracy in the calculations of margins (~0.001)
  // To allow for this inaccuracy we make the dimension slightly bigger for this calculation
  const isWithinHorizontal = isWithin(left - 1, right + 1);
  const isWithinVertical = isWithin(top - 1, bottom + 1);

  return (draggable: DraggableDimension): boolean => {
    // margin may bleed outside of container size
    const fragment: DimensionFragment = draggable.page.withoutMargin;

    return isWithinHorizontal(fragment.left) &&
      isWithinHorizontal(fragment.right) &&
      isWithinVertical(fragment.top) &&
      isWithinVertical(fragment.bottom);
  };
};
