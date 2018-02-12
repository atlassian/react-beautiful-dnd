// @flow
import { vertical, horizontal } from './axis';
import getArea from './get-area';
import { offsetByPosition, expandBySpacing, expandByPosition } from './spacing';
import { subtract, negate } from './position';
import getMaxScroll from './get-max-scroll';
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
  ClosestScrollable,
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
  const withScroll = offsetByPosition(client, windowScroll);

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
      withMargin: getArea(expandBySpacing(client, margin)),
    },
    // with scroll
    page: {
      withoutMargin: getArea(withScroll),
      withMargin: getArea(expandBySpacing(withScroll, margin)),
    },
  };

  return dimension;
};

type GetDroppableArgs = {|
  descriptor: DroppableDescriptor,
  client: Area,
  // optionally provided - and can also be null
  closest?: ?{|
    frameClient: Area,
    scrollWidth: number,
    scrollHeight: number,
    scroll: Position,
    shouldClipSubject: boolean,
  |},
  direction?: Direction,
  margin?: Spacing,
  padding?: Spacing,
  windowScroll?: Position,
  // Whether or not the droppable is currently enabled (can change at during a drag)
  // defaults to true
  isEnabled?: boolean,
|}

// will return null if the subject is completely not visible within frame
export const clip = (frame: Area, subject: Spacing): ?Area => {
  const result: Area = getArea({
    top: Math.max(subject.top, frame.top),
    right: Math.min(subject.right, frame.right),
    bottom: Math.min(subject.bottom, frame.bottom),
    left: Math.max(subject.left, frame.left),
  });

  if (result.width <= 0 || result.height <= 0) {
    return null;
  }

  return result;
};

export const scrollDroppable = (
  droppable: DroppableDimension,
  newScroll: Position
): DroppableDimension => {
  if (!droppable.viewport.closestScrollable) {
    console.error('Cannot scroll droppble that does not have a closest scrollable');
    return droppable;
  }

  const existingScrollable: ClosestScrollable = droppable.viewport.closestScrollable;

  const frame: Area = existingScrollable.frame;

  const scrollDiff: Position = subtract(newScroll, existingScrollable.scroll.initial);
  // a positive scroll difference leads to a negative displacement
  // (scrolling down pulls an item upwards)
  const scrollDisplacement: Position = negate(scrollDiff);

  const closestScrollable: ClosestScrollable = {
    frame: existingScrollable.frame,
    shouldClipSubject: existingScrollable.shouldClipSubject,
    scroll: {
      initial: existingScrollable.scroll.initial,
      current: newScroll,
      diff: {
        value: scrollDiff,
        displacement: scrollDisplacement,
      },
      max: existingScrollable.scroll.max,
    },
  };

  const displacedSubject: Spacing =
    offsetByPosition(droppable.viewport.subject, scrollDisplacement);

  const clipped: ?Area = closestScrollable.shouldClipSubject ?
    clip(frame, displacedSubject) :
    getArea(displacedSubject);

  const viewport: DroppableDimensionViewport = {
    closestScrollable,
    subject: droppable.viewport.subject,
    clipped,
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
  closest,
  direction = 'vertical',
  margin = noSpacing,
  padding = noSpacing,
  windowScroll = origin,
  isEnabled = true,
}: GetDroppableArgs): DroppableDimension => {
  const withMargin: Spacing = expandBySpacing(client, margin);
  const withWindowScroll: Spacing = offsetByPosition(client, windowScroll);
  const subject: Area = getArea(expandBySpacing(withWindowScroll, margin));

  const closestScrollable: ?ClosestScrollable = (() => {
    if (!closest) {
      return null;
    }

    const frame: Area = getArea(offsetByPosition(closest.frameClient, windowScroll));

    const maxScroll: Position = getMaxScroll({
      scrollHeight: closest.scrollHeight,
      scrollWidth: closest.scrollWidth,
      height: frame.height,
      width: frame.width,
    });

    const result: ClosestScrollable = {
      frame,
      shouldClipSubject: closest.shouldClipSubject,
      scroll: {
        initial: closest.scroll,
        // no scrolling yet, so current = initial
        current: closest.scroll,
        max: maxScroll,
        diff: {
          value: origin,
          displacement: origin,
        },
      },
    };

    return result;
  })();

  const clipped: ?Area = (closestScrollable && closestScrollable.shouldClipSubject) ?
    clip(closestScrollable.frame, subject) :
    subject;

  const viewport: DroppableDimensionViewport = {
    closestScrollable,
    subject,
    clipped,
  };

  const dimension: DroppableDimension = {
    descriptor,
    isEnabled,
    axis: direction === 'vertical' ? vertical : horizontal,
    client: {
      withoutMargin: getArea(client),
      withMargin: getArea(withMargin),
      withMarginAndPadding: getArea(expandBySpacing(withMargin, padding)),
    },
    page: {
      withoutMargin: getArea(withWindowScroll),
      withMargin: subject,
      withMarginAndPadding:
        getArea(expandBySpacing(expandBySpacing(withWindowScroll, margin), padding)),
    },
    viewport,
  };

  return dimension;
};
