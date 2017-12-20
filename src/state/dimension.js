// @flow
import { vertical, horizontal } from './axis';
import getArea, { getWithPosition, getWithSpacing } from './get-area';
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
  Area,
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
  area: Area,
  margin?: Spacing,
  windowScroll?: Position,
|};

export const getDraggableDimension = ({
  descriptor,
  area,
  margin = noSpacing,
  windowScroll = origin,
}: GetDraggableArgs): DraggableDimension => {
  const withScroll = getWithPosition(area, windowScroll);

  const dimension: DraggableDimension = {
    descriptor,
    placeholder: {
      margin,
      withoutMargin: {
        width: area.width,
        height: area.height,
      },
    },
    // on the viewport
    client: {
      withoutMargin: getArea(area),
      withMargin: getArea(getWithSpacing(area, margin)),
    },
    // with scroll
    page: {
      withoutMargin: getArea(withScroll),
      withMargin: getArea(getWithSpacing(withScroll, margin)),
    },
  };

  return dimension;
};

type GetDroppableArgs = {|
  descriptor: DroppableDescriptor,
  client: Area,
  // optionally provided - and can also be null
  frameClient?: ?Area,
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
  frame: Area,
  subject: Spacing
): Area =>
  getArea(getArea({
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
  // If no frameClient is provided, or if the area matches the frameClient, this
  // droppable is its own container. In this case we include its margin in the container bounds.
  // Otherwise, the container is a scrollable parent. In this case we don't care about margins
  // in the container bounds.

  const subject: Area = getWithSpacing(withWindowScroll, margin);

  // use client + margin if frameClient is not provided
  const frame: Area = (() => {
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
      withoutMargin: getArea(client),
      withMargin: getArea(withMargin),
      withMarginAndPadding: getArea(getWithSpacing(withMargin, padding)),
    },
    page: {
      withoutMargin: getArea(withWindowScroll),
      withMargin: subject,
      withMarginAndPadding: getArea(getWithSpacing(withWindowScroll, add(margin, padding))),
    },
    viewport,
  };

  return dimension;
};
