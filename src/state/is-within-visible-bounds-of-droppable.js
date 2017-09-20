// @flow
import isWithin from './is-within';
import { subtract } from './position';
import type {
  Position,
  DraggableDimension,
  DroppableDimension,
  DimensionFragment,
} from '../types';

export const isPointWithin = (droppable: DroppableDimension) => {
  const droppableRect = droppable.page.withMarginAndPadding;
  const { container } = droppable;

  // Calculate the mid-drag scroll ∆ of the scroll container
  const containerScrollDiff = subtract(container.scroll.current, container.scroll.initial);

  // Calculate the droppable's bounds, accounting for the container's scroll
  const droppableBounds = {
    top: droppableRect.top - containerScrollDiff.y,
    right: droppableRect.right - containerScrollDiff.x,
    bottom: droppableRect.bottom - containerScrollDiff.y,
    left: droppableRect.left - containerScrollDiff.x,
  };

  // Clip the droppable's bounds by the scroll container's bounds
  // This gives us the droppable's true visible area
  // Note: if the droppable doesn't have a scroll parent droppableBounds === container.page
  const clippedBounds = {
    top: Math.max(droppableBounds.top, container.page.top),
    right: Math.min(droppableBounds.right, container.page.right),
    bottom: Math.min(droppableBounds.bottom, container.page.bottom),
    left: Math.max(droppableBounds.left, container.page.left),
  };

  const isWithinHorizontal = isWithin(clippedBounds.left, clippedBounds.right);
  const isWithinVertical = isWithin(clippedBounds.top, clippedBounds.bottom);

  return (point: Position): boolean => (
    isWithinHorizontal(point.x) &&
    isWithinVertical(point.y)
  );
};

export const isDraggableWithin = (droppable: DroppableDimension) => {
  const { top, right, bottom, left } = droppable.container.page;

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
