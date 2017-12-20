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
      withoutMargin: getClientRect(clientRect),
      withMargin: getClientRect(getWithSpacing(clientRect, margin)),
    },
    // with scroll
    page: {
      withoutMargin: getClientRect(withScroll),
      withMargin: getClientRect(getWithSpacing(withScroll, margin)),
    },
  };

  return dimension;
};

type GetDroppableArgs = {|
  descriptor: DroppableDescriptor,
  client: ClientRect,
  // optionally provided - and can also be null
  frameClient?: ?ClientRect,
  frameScroll?: Position,
  direction?: Direction,
  margin?: Spacing,
  padding?: Spacing,
  windowScroll?: Position,
  // Whether or not the droppable is currently enabled (can change at during a drag)
  // defaults to true
  isEnabled?: boolean,
|}

export const clip = (
  frame: ClientRect,
  subject: Spacing
): ClientRect =>
  getClientRect(getClientRect({
    top: Math.max(subject.top, frame.top),
    right: Math.min(subject.right, frame.right),
    bottom: Math.min(subject.bottom, frame.bottom),
    left: Math.max(subject.left, frame.left),
  }));

export const scrollDroppable = (
  droppable: DroppableDimension,
  newScroll: Position
): DroppableDimension => {
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

  const subject: ClientRect = getWithSpacing(withWindowScroll, margin);

  // use client + margin if frameClient is not provided
  const frame: ClientRect = (() => {
    if (!frameClient) {
      return subject;
    }
    return getWithPosition(frameClient, windowScroll);
  })();

  const viewport: DroppableDimensionViewport = {
    frame,
    frameScroll: {
      initial: frameScroll,
      // no scrolling yet, so current = initial
      current: frameScroll,
      diff: origin,
    },
    subject,
    clipped: clip(frame, subject),
  };

  const dimension: DroppableDimension = {
    descriptor,
    isEnabled,
    axis: direction === 'vertical' ? vertical : horizontal,
    client: {
      withoutMargin: getClientRect(client),
      withMargin: getClientRect(withMargin),
      withMarginAndPadding: getClientRect(getWithSpacing(withMargin, padding)),
    },
    page: {
      withoutMargin: getClientRect(withWindowScroll),
      withMargin: subject,
      withMarginAndPadding: getClientRect(getWithSpacing(withWindowScroll, add(margin, padding))),
    },
    viewport,
  };

  return dimension;
};
