// @flow
import isPartiallyWithin from './is-partially-within';
import { isSpacingVisible as isPartiallyVisibleInDroppable } from './is-within-visible-bounds-of-droppable';
import { offset } from '../spacing';
import type {
  Spacing,
  Position,
  Area,
  DraggableDimension,
  DroppableDimension,
} from '../../types';

type IsPartiallyVisibleArgs = {|
  target: Spacing,
  droppable: DroppableDimension,
  viewport: Area,
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
    isPartiallyWithin(viewport)(withScroll);

  return isVisibleWithinViewport;
};

type IsDraggableVisibleArgs = {|
  draggable: DraggableDimension,
  droppable: DroppableDimension,
  viewport: Area,
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

type IsPositionVisibleArgs = {|
  point: Position,
  droppable: DroppableDimension,
  viewport: Area,
|}

export const isPositionVisible = ({
  point,
  droppable,
  viewport,
}: IsPositionVisibleArgs): boolean => {
  const target: Spacing = {
    top: point.y,
    left: point.x,
    bottom: point.y,
    right: point.x,
  };
  return isPartiallyVisible({
    target,
    droppable,
    viewport,
  });
};

