// @flow
import { vertical, horizontal } from './axis';
import getArea from './get-area';
import { add, offset } from './spacing';
import { subtract, negate } from './position';
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

const addPosition = (area: Area, point: Position): Area => {
  const { top, right, bottom, left } = area;
  return getArea({
    top: top + point.y,
    left: left + point.x,
    bottom: bottom + point.y,
    right: right + point.x,
  });
};

const addSpacing = (area: Area, spacing: Spacing): Area => {
  const { top, right, bottom, left } = area;
  return getArea({
    // pulling back to increase size
    top: top - spacing.top,
    left: left - spacing.left,
    // pushing forward to increase size
    bottom: bottom + spacing.bottom,
    right: right + spacing.right,
  });
};

type GetDraggableArgs = {|
  descriptor: DraggableDescriptor,
  client: Area,
  margin?: Spacing,
  windowScroll?: Position,
|};

export const getDraggableDimension = ({
  descriptor,
  client,
  margin = noSpacing,
  windowScroll = origin,
}: GetDraggableArgs): DraggableDimension => {
  const withScroll = addPosition(client, windowScroll);

  const dimension: DraggableDimension = {
    descriptor,
    placeholder: {
      margin,
      withoutMargin: {
        width: client.width,
        height: client.height,
      },
    },
    // on the viewport
    client: {
      withoutMargin: getArea(client),
      withMargin: getArea(addSpacing(client, margin)),
    },
    // with scroll
    page: {
      withoutMargin: getArea(withScroll),
      withMargin: getArea(addSpacing(withScroll, margin)),
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

export const clip = (frame: Area, subject: Spacing): Area =>
  getArea({
    top: Math.max(subject.top, frame.top),
    right: Math.min(subject.right, frame.right),
    bottom: Math.min(subject.bottom, frame.bottom),
    left: Math.max(subject.left, frame.left),
  });

export const scrollDroppable = (
  droppable: DroppableDimension,
  newScroll: Position
): DroppableDimension => {
  const existing: DroppableDimensionViewport = droppable.viewport;

  const scrollDiff: Position = subtract(newScroll, existing.frameScroll.initial);
  // a positive scroll difference leads to a negative displacement
  // (scrolling down pulls an item upwards)
  const scrollDisplacement: Position = negate(scrollDiff);
  const scrolledSubject: Spacing = offset(existing.subject, scrollDisplacement);

  const viewport: DroppableDimensionViewport = {
    frame: existing.frame,
    frameScroll: {
      initial: existing.frameScroll.initial,
      current: newScroll,
      diff: {
        value: scrollDiff,
        displacement: scrollDisplacement,
      },
    },
    subject: existing.subject,
    clipped: clip(existing.frame, scrolledSubject),
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
  const withMargin = addSpacing(client, margin);
  const withWindowScroll = addPosition(client, windowScroll);
  // If no frameClient is provided, or if the area matches the frameClient, this
  // droppable is its own container. In this case we include its margin in the container bounds.
  // Otherwise, the container is a scrollable parent. In this case we don't care about margins
  // in the container bounds.

  const subject: Area = addSpacing(withWindowScroll, margin);

  // use client + margin if frameClient is not provided
  const frame: Area = (() => {
    if (!frameClient) {
      return subject;
    }
    return addPosition(frameClient, windowScroll);
  })();

  const viewport: DroppableDimensionViewport = {
    frame,
    frameScroll: {
      initial: frameScroll,
      // no scrolling yet, so current = initial
      current: frameScroll,
      diff: {
        value: origin,
        displacement: origin,
      },
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
      withMarginAndPadding: getArea(addSpacing(withMargin, padding)),
    },
    page: {
      withoutMargin: getArea(withWindowScroll),
      withMargin: subject,
      withMarginAndPadding: getArea(addSpacing(withWindowScroll, add(margin, padding))),
    },
    viewport,
  };

  return dimension;
};
