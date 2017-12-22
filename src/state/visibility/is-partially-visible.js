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
  // console.log('ehllo?');

  // already takes into account droppable scroll
  const isVisibleWithinDroppable: boolean =
    isPartiallyVisibleInDroppable(droppable)(target);

  // exit early
  if (!isVisibleWithinDroppable) {
    // console.log('is not visible in droppable');
    return false;
  }

  const displacement: Position = droppable.viewport.frameScroll.diff.displacement;
  const withScroll: Spacing = offset(target, displacement);

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
}: IsDraggableVisibleArgs): boolean => {
  const result = isPartiallyVisible({
    target: draggable.page.withMargin,
    droppable,
    viewport,
  });

  if (draggable.descriptor.id === 'quote-6') {
    console.warn('is visible in droppable?', result);
  }

  return result;
};

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

