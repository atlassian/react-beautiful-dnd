// @flow
import type {
  DraggableDimension,
  DroppableDimension,
  ClientRect,
  DimensionFragment,
} from '../types';
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
  const isWithinVertical = isWithin(viewport.top, viewport.bottom);
  const isWithinHorizontal = isWithin(viewport.left, viewport.right);

  const fragment: DimensionFragment = displaced.page.withMargin;

  const isPartiallyVisibleVertically: boolean =
    isWithinVertical(fragment.top) || isWithinVertical(fragment.bottom);
  const isPartiallyVisibleHorizontally: boolean =
    isWithinHorizontal(fragment.left) || isWithinHorizontal(fragment.right);

  return isPartiallyVisibleVertically && isPartiallyVisibleHorizontally;
};
