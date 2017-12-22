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
  // TODO: if dimension is bigger than droppable or bigger than viewport - it is visibile

  // already takes into account droppable scroll
  const isVisibleWithinDroppable: boolean =
    isPartiallyVisibleInDroppable(droppable)(target);

  console.log('is visible in droppable', isVisibleWithinDroppable);
  // exit early
  if (!isVisibleWithinDroppable) {
    return false;
  }

  const displacement: Position = droppable.viewport.frameScroll.diff.displacement;
  const withScroll: Spacing = offset(target, displacement);

  console.log('viewport', viewport);
  console.log('with scroll', withScroll);

  const isVisibleWithinViewport: boolean =
    isPartiallyWithin(viewport)(withScroll);

  console.log('is visible in viewport?', isVisibleWithinViewport);

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
  console.group('is draggable visible?');
  const result = isPartiallyVisible({
    target: draggable.page.withMargin,
    droppable,
    viewport,
  });
  console.warn('is draggable visible?', result);
  console.groupEnd();

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

