// @flow
import { vertical, horizontal } from './axis';
import getClientRect from './get-client-rect';
import type {
  DroppableId,
  DraggableId,
  Position,
  DraggableDimension,
  DroppableDimension,
  Direction,
  DimensionFragment,
  Spacing,
  ClientRect,
} from '../types';

const origin: Position = { x: 0, y: 0 };

export const noSpacing: Spacing = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

const getWithPosition = (clientRect: ClientRect, point: Position): ClientRect => {
  const { top, right, bottom, left } = clientRect;
  return getClientRect({
    top: top + point.y,
    left: left + point.x,
    bottom: bottom + point.y,
    right: right + point.x,
  });
};

const getWithSpacing = (clientRect: ClientRect, spacing: Spacing): ClientRect => {
  const { top, right, bottom, left } = clientRect;
  return getClientRect({
    top: top + spacing.top,
    left: left + spacing.left,
    bottom: bottom + spacing.bottom,
    right: right + spacing.right,
  });
};

const getFragment = (
  initial: ClientRect | DimensionFragment,
  point?: Position = origin,
): DimensionFragment => ({
  top: initial.top + point.y,
  left: initial.left + point.x,
  bottom: initial.bottom + point.y,
  right: initial.right + point.x,
  width: initial.width,
  height: initial.height,
  center: {
    x: ((initial.right + point.x) + (initial.left + point.x)) / 2,
    y: ((initial.bottom + point.y) + (initial.top + point.y)) / 2,
  },
});

type GetDraggableArgs = {|
  id: DraggableId,
  droppableId: DroppableId,
  clientRect: ClientRect,
  margin?: Spacing,
  windowScroll?: Position,
|};

export const getDraggableDimension = ({
  id,
  droppableId,
  clientRect,
  margin = noSpacing,
  windowScroll = origin,
}: GetDraggableArgs): DraggableDimension => {
  const withScroll = getWithPosition(clientRect, windowScroll);
  const withScrollAndMargin = getWithSpacing(withScroll, margin);

  const dimension: DraggableDimension = {
    id,
    droppableId,
    // on the viewport
    client: {
      withoutMargin: getFragment(clientRect),
      withMargin: getFragment(getWithSpacing(clientRect, margin)),
    },
    // with scroll
    page: {
      withoutMargin: getFragment(withScroll),
      withMargin: getFragment(withScrollAndMargin),
    },
  };

  return dimension;
};

type GetDroppableArgs = {|
  id: DroppableId,
  clientRect: ClientRect,
  direction?: Direction,
  margin?: Spacing,
  padding?: Spacing,
  windowScroll?: Position,
  scroll ?: Position,
  // Whether or not the droppable is currently enabled (can change at during a drag)
  // defaults to true
  isEnabled?: boolean,
|}

const add = (spacing1: Spacing, spacing2: Spacing): Spacing => ({
  top: spacing1.top + spacing2.top,
  left: spacing1.left + spacing2.left,
  right: spacing1.right + spacing2.right,
  bottom: spacing1.bottom + spacing2.bottom,
});

export const getDroppableDimension = ({
  id,
  clientRect,
  direction = 'vertical',
  margin = noSpacing,
  padding = noSpacing,
  windowScroll = origin,
  scroll = origin,
  isEnabled = true,
}: GetDroppableArgs): DroppableDimension => {
  const withMargin = getWithSpacing(clientRect, margin);
  const withWindowScroll = getWithPosition(clientRect, windowScroll);

  const dimension: DroppableDimension = {
    id,
    isEnabled,
    axis: direction === 'vertical' ? vertical : horizontal,
    scroll: {
      initial: scroll,
      // when we start the current scroll is the initial scroll
      current: scroll,
    },
    client: {
      withoutMargin: getFragment(clientRect),
      withMargin: getFragment(withMargin),
      withMarginAndPadding: getFragment(getWithSpacing(withMargin, padding)),
    },
    page: {
      withoutMargin: getFragment(withWindowScroll),
      withMargin: getFragment(getWithSpacing(withWindowScroll, margin)),
      withMarginAndPadding: getFragment(getWithSpacing(withWindowScroll, add(margin, padding))),
    },
  };

  return dimension;
};
