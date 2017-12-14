// @flow
import type {
  DraggableDimension,
  DroppableDimension,
  ClientRect,
  DimensionFragment,
  Position,
  Spacing,
} from '../types';
import { subtract } from './position';
import { offset, getSpacingFrom } from './spacing';
import isWithin from './is-within';

type Args = {|
  displaced: DraggableDimension,
  droppable: DroppableDimension,
  viewport: ClientRect,
|}

export default ({
  displaced,
  droppable,
  viewport,
}: Args): boolean => {
  const droppableScrollDiff: Position = subtract(
    droppable.container.scroll.initial,
    droppable.container.scroll.current,
  );

  // viewport check:
  const isWithinVertical = isWithin(viewport.top, viewport.bottom);
  const isWithinHorizontal = isWithin(viewport.left, viewport.right);

  const fragment: DimensionFragment = displaced.page.withMargin;
  const spacing: Spacing = offset(getSpacingFrom(fragment), droppableScrollDiff);

  const isPartiallyVisibleVertically: boolean =
    isWithinVertical(spacing.top) || isWithinVertical(spacing.bottom);
  const isPartiallyVisibleHorizontally: boolean =
    isWithinHorizontal(spacing.left) || isWithinHorizontal(spacing.right);

  return isPartiallyVisibleVertically && isPartiallyVisibleHorizontally;
};
