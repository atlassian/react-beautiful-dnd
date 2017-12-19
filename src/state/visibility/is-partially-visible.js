// @flow
import isPartiallyWithin from './is-partially-within';
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

export const isPartiallyVisible = ({
  target,
  droppable,
  viewport,
}: IsPartiallyVisibleArgs): boolean => {
  const droppableScrollDiff: Position = subtract(
    droppable.container.scroll.initial,
    droppable.container.scroll.current,
  );
  const withScroll: Spacing = offset(target, droppableScrollDiff);

  const isVisibleWithinDroppable: boolean =
    isPartiallyWithin(droppable.container.bounds)(withScroll);

  // exit early
  if (!isVisibleWithinDroppable) {
    return false;
  }

  const isVisibleWithinViewport: boolean =
    isPartiallyWithin(viewport)(withScroll);

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

