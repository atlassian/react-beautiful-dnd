// @flow
import { vertical, horizontal } from './axis';
import getClientRect, { getWithPosition, getWithSpacing } from './get-client-rect';
import { add, offset } from './spacing';
import { subtract } from './position';
import type {
  DraggableDescriptor,
  DroppableDescriptor,
  Position,
  DraggableDimension,
  DroppableDimension,
  Direction,
  DimensionFragment,
  Spacing,
  ClientRect,
  DroppableDimensionViewport,
} from '../types';

const origin: Position = { x: 0, y: 0 };

export const noSpacing: Spacing = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export const getFragment = (
  initial: ClientRect | DimensionFragment,
  point?: Position = origin,
): DimensionFragment => {
  const rect: ClientRect = getClientRect({
    top: initial.top + point.y,
    left: initial.left + point.x,
    bottom: initial.bottom + point.y,
    right: initial.right + point.x,
  });

  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    center: {
      x: (rect.right + rect.left) / 2,
      y: (rect.bottom + rect.top) / 2,
    },
  };
};

type GetDraggableArgs = {|
  descriptor: DraggableDescriptor,
  clientRect: ClientRect,
  margin?: Spacing,
  windowScroll?: Position,
|};

export const getDraggableDimension = ({
  descriptor,
  clientRect,
  margin = noSpacing,
  windowScroll = origin,
}: GetDraggableArgs): DraggableDimension => {
  const withScroll = getWithPosition(clientRect, windowScroll);

  const dimension: DraggableDimension = {
    descriptor,
    placeholder: {
      margin,
      withoutMargin: {
        width: clientRect.width,
        height: clientRect.height,
      },
    },
    // on the viewport
    client: {
      withoutMargin: getFragment(clientRect),
      withMargin: getFragment(getWithSpacing(clientRect, margin)),
    },
    // with scroll
    page: {
      withoutMargin: getFragment(withScroll),
      withMargin: getFragment(getWithSpacing(withScroll, margin)),
    },
  };

  return dimension;
};

type GetDroppableArgs = {|
  descriptor: DroppableDescriptor,
  client: ClientRect,
  frameClient?: ClientRect,
  frameScroll?: Position,
  direction?: Direction,
  margin?: Spacing,
  padding?: Spacing,
  windowScroll?: Position,
  // Whether or not the droppable is currently enabled (can change at during a drag)
  // defaults to true
  isEnabled?: boolean,
|}

const clip = (frame: ClientRect, subject: DimensionFragment | Spacing | ClientRect): DimensionFragment =>
  getFragment(getClientRect({
    top: Math.max(subject.top, frame.top),
    right: Math.min(subject.right, frame.right),
    bottom: Math.min(subject.bottom, frame.bottom),
    left: Math.max(subject.left, frame.left),
  }));

export const scrollDroppable = (droppable: DroppableDimension, newScroll: Position): DroppableDimension => {
  const existing: DroppableDimensionViewport = droppable.viewport;

  const scrollDiff: Position = subtract(existing.frameScroll.initial, newScroll);
  const shiftedSubject: Spacing = offset(existing.subject, scrollDiff);

  const viewport: DroppableDimensionViewport = {
    frame: existing.frame,
    frameScroll: {
      initial: existing.frameScroll.initial,
      current: newScroll,
      diff: scrollDiff,
    },
    subject: existing.subject,
    clipped: clip(existing.frame, shiftedSubject),
  };

  // $ExpectError - using spread
  return {
    ...droppable,
    viewport,
  };
};

export const getDroppableDimension = ({
  descriptor,
  client,
  frameClient,
  frameScroll = origin,
  direction = 'vertical',
  margin = noSpacing,
  padding = noSpacing,
  windowScroll = origin,
  isEnabled = true,
}: GetDroppableArgs): DroppableDimension => {
  const withMargin = getWithSpacing(client, margin);
  const withWindowScroll = getWithPosition(client, windowScroll);
  // If no containerRect is provided, or if the clientRect matches the containerRect, this
  // droppable is its own container. In this case we include its margin in the container bounds.
  // Otherwise, the container is a scrollable parent. In this case we don't care about margins
  // in the container bounds.

  const subject: DimensionFragment =
    getFragment(getWithSpacing(withWindowScroll, margin));

  // use client + margin if frameClient is not provided
  const frame: ClientRect = frameClient || withMargin;
  const frameWithWindowScroll = getWithPosition(frame, windowScroll);

  const viewport: DroppableDimensionViewport = {
    frame: frameWithWindowScroll,
    frameScroll: {
      initial: frameScroll,
      // no scrolling yet, so current = initial
      current: frameScroll,
      diff: origin,
    },
    subject,
    clipped: clip(frameWithWindowScroll, subject),
  };

  const dimension: DroppableDimension = {
    descriptor,
    isEnabled,
    axis: direction === 'vertical' ? vertical : horizontal,
    client: {
      withoutMargin: getFragment(client),
      withMargin: getFragment(withMargin),
      withMarginAndPadding: getFragment(getWithSpacing(withMargin, padding)),
    },
    page: {
      withoutMargin: getFragment(withWindowScroll),
      withMargin: subject,
      withMarginAndPadding: getFragment(getWithSpacing(withWindowScroll, add(margin, padding))),
    },
    viewport,
  };

  return dimension;
};
