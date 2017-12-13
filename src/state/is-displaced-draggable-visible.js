// @flow
import type {
  DraggableDimension,
  DroppableDimension,
  ClientRect,
  DimensionFragment,
} from '../types';
import isWithin from './is-within';

type Args = {|
  draggable: DraggableDimension,
  displaced: DraggableDimension,
  droppable: DroppableDimension,
  viewport: ClientRect,
|}

export default ({
  draggable,
  displaced,
  droppable,
  viewport,
}: Args): boolean => {
  const isWithinHorizontal = isWithin(viewport.left, viewport.right);
  const isWithinVertical = isWithin(viewport.top, viewport.bottom);

  const fragment: DimensionFragment = displaced.page.withMargin;

  const isPartiallyVisibleVertically: boolean =
    isWithinVertical(fragment.top) || isWithinVertical(fragment.bottom);
  const isPartiallyVisibleHorizontally: boolean =
    isWithinHorizontal(fragment.left) || isWithinHorizontal(fragment.right);

  return isPartiallyVisibleVertically && isPartiallyVisibleHorizontally;
};
