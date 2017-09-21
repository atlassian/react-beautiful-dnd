// @flow
import isWithin from './is-within';
import { subtract, offsetSpacing } from './position';
import type {
  Position,
  DraggableDimension,
  DroppableDimension,
  DimensionFragment,
} from '../types';

export const isPointWithin = (droppable: DroppableDimension) => {
  // Calculate the mid-drag scroll ∆ of the scroll container
  const scroll = droppable.container.scroll;
  const containerScrollDiff = subtract(scroll.initial, scroll.current);

  // Calculate the droppable's bounds, accounting for the container's scroll
  const droppableBounds = offsetSpacing(droppable.page.withMargin, containerScrollDiff);

  // Clip the droppable's bounds by the scroll container's bounds
  // This gives us the droppable's true visible area
  // Note: if the droppable doesn't have a scroll parent droppableBounds === container.page
  const containerBounds = droppable.container.page.withoutMargin;
  const clippedBounds = {
    top: Math.max(droppableBounds.top, containerBounds.top),
    right: Math.min(droppableBounds.right, containerBounds.right),
    bottom: Math.min(droppableBounds.bottom, containerBounds.bottom),
    left: Math.max(droppableBounds.left, containerBounds.left),
  };

  const isWithinHorizontal = isWithin(clippedBounds.left, clippedBounds.right);
  const isWithinVertical = isWithin(clippedBounds.top, clippedBounds.bottom);

  return (point: Position): boolean => (
    isWithinHorizontal(point.x) &&
    isWithinVertical(point.y)
  );
};

export const isDraggableWithin = (droppable: DroppableDimension) => {
  const { top, right, bottom, left } = droppable.container.page.withoutMargin;

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
