// @flow
import { isSpacingPartiallyWithin } from './is-partially-within';
import { isSpacingVisible as isPartiallyVisibleInDroppable } from './is-within-visible-bounds-of-droppable';
import { offset } from '../spacing';
import type {
  Spacing,
  Position,
  ClientRect,
  DraggableDimension,
  DroppableDimension,
} from '../../types';

type IsPartiallyVisibleArgs = {|
  target: Spacing,
  droppable: DroppableDimension,
  viewport: ClientRect,
|}

export const isPartiallyVisible = ({
  target,
  droppable,
  viewport,
}: IsPartiallyVisibleArgs): boolean => {
  const droppableScrollDiff: Position = droppable.viewport.frameScroll.diff;
  const withScroll: Spacing = offset(target, droppableScrollDiff);

  const isVisibleWithinDroppable: boolean =
    isPartiallyVisibleInDroppable(droppable)(withScroll);

  // exit early
  if (!isVisibleWithinDroppable) {
    return false;
  }

  const isVisibleWithinViewport: boolean =
    isSpacingPartiallyWithin(viewport)(withScroll);

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

