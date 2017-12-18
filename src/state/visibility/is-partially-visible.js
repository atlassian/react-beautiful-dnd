// @flow
import isWithin from '../is-within';
import { subtract } from '../position';
import { offset, getSpacingFrom } from '../spacing';
import type {
  Spacing,
  Position,
  ClientRect,
  DraggableDimension,
  DroppableDimension,
} from '../../types';

type IsSpacingPartiallyVisibleArgs = {|
  spacing: Spacing,
  droppable: DroppableDimension,
  viewport: ClientRect,
|}

export const isSpacingPartiallyVisible = ({
  spacing,
  droppable,
  viewport,
}: IsSpacingPartiallyVisibleArgs): boolean => {
  // Need to account for change in droppable scroll position
  const droppableScrollDiff: Position = subtract(
    droppable.container.scroll.initial,
    droppable.container.scroll.current,
  );

  const isWithinVertical = isWithin(viewport.top, viewport.bottom);
  const isWithinHorizontal = isWithin(viewport.left, viewport.right);

  const withDroppableScroll: Spacing = offset(spacing, droppableScrollDiff);

  const isPartiallyVisibleVertically: boolean =
    isWithinVertical(withDroppableScroll.top) || isWithinVertical(withDroppableScroll.bottom);
  const isPartiallyVisibleHorizontally: boolean =
    isWithinHorizontal(withDroppableScroll.left) || isWithinHorizontal(withDroppableScroll.right);

  return isPartiallyVisibleVertically && isPartiallyVisibleHorizontally;
};

type IsDraggableVisibleArgs = {|
  draggable: DraggableDimension,
  droppable: DroppableDimension,
  viewport: ClientRect,
|}

export const isDraggablePartiallyVisible = ({
  draggable,
  droppable,
  viewport,
}: IsDraggableVisibleArgs): boolean => isSpacingPartiallyVisible({
  spacing: getSpacingFrom(draggable.page.withMargin),
  droppable,
  viewport,
});

