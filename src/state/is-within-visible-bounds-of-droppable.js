// @flow
import isWithin from './is-within';
import type {
  Position,
  DraggableDimension,
  DroppableDimension,
  DimensionFragment,
} from '../types';

export const isPointWithin = (droppable: DroppableDimension) => {
  const { top, right, bottom, left } = droppable.page.withMargin;

  const isWithinHorizontal = isWithin(left, right);
  const isWithinVertical = isWithin(top, bottom);

  return (point: Position): boolean => (
    isWithinHorizontal(point.x) &&
    isWithinVertical(point.y)
  );
};

export const isDraggableWithin = (droppable: DroppableDimension) => {
  const { top, right, bottom, left } = droppable.page.withMargin;

  // There are some extremely minor inaccuracy in the calculations of margins (~0.001)
  // To allow for this inaccuracy we make the dimension slightly bigger for this calculation
  const isWithinHorizontal = isWithin(left - 1, right + 1);
  const isWithinVertical = isWithin(top - 1, bottom + 1);

  return (draggable: DraggableDimension): boolean => {
    const fragment: DimensionFragment = draggable.page.withMargin;

    return isWithinHorizontal(fragment.left) &&
      isWithinHorizontal(fragment.right) &&
      isWithinVertical(fragment.top) &&
      isWithinVertical(fragment.bottom);
  };
};
