// @flow
import isPartiallyWithin from './is-partially-within';
import { isSpacingVisible } from './is-within-visible-bounds-of-droppable';
import { subtract } from '../position';
import { offset } from '../spacing';
import type {
  Spacing,
  Position,
  ClientRect,
  DraggableDimension,
  DroppableDimension,
} from '../../types';

type IsPartiallyVisibleArgs = {|
  target: Spacing | ClientRect,
  droppable: DroppableDimension,
  viewport: ClientRect,
|}

// TODO: own scroll?
export const isPartiallyVisible = ({
  target,
  droppable,
  viewport,
}: IsPartiallyVisibleArgs): boolean => {
  // const droppableScrollDiff: Position = subtract(
  //   droppable.container.scroll.initial,
  //   droppable.container.scroll.current,
  // );
  // const withScroll: Spacing = offset(target, droppableScrollDiff);

  // TODO: scroll diff

  const isVisibleWithinDroppable: boolean =
    isSpacingVisible(droppable)(target);

  // exit early
  if (!isVisibleWithinDroppable) {
    return false;
  }

  const isVisibleWithinViewport: boolean =
    isPartiallyWithin(viewport)(target);

  return isVisibleWithinViewport;
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
}: IsDraggableVisibleArgs): boolean => isPartiallyVisible({
  target: draggable.page.withMargin,
  droppable,
  viewport,
});

