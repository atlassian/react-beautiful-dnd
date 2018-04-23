// @flow
import { getRect } from 'css-box-model';
import type { Rect } from 'css-box-model';
import { vertical, horizontal } from './axis';
import { offsetByPosition, expandBySpacing, shrinkBySpacing } from './spacing';
import { subtract, negate } from './position';
import getMaxScroll from './get-max-scroll';
import type {
  DroppableDescriptor,
  Position,
  DraggableDimension,
  DroppableDimension,
  Direction,
  Spacing,
  DroppableDimensionViewport,
  Scrollable,
} from '../types';

const origin: Position = { x: 0, y: 0 };

export const noSpacing: Spacing = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

// will return null if the subject is completely not visible within frame
export const clip = (frame: Rect, subject: Rect): ?Rect => {
  const result: Rect = getRect({
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

  const existingScrollable: Scrollable = droppable.viewport.closestScrollable;

  const frame: Area = existingScrollable.frame;

  const scrollDiff: Position = subtract(newScroll, existingScrollable.scroll.initial);
  // a positive scroll difference leads to a negative displacement
  // (scrolling down pulls an item upwards)
  const scrollDisplacement: Position = negate(scrollDiff);

  // Sometimes it is possible to scroll beyond the max point.
  // This can occur when scrolling a foreign list that now has a placeholder.

  const closestScrollable: Scrollable = {
    frame: existingScrollable.frame,
    shouldClipSubject: existingScrollable.shouldClipSubject,
    scroll: {
      initial: existingScrollable.scroll.initial,
      current: newScroll,
      diff: {
        value: scrollDiff,
        displacement: scrollDisplacement,
      },
      // TODO: rename 'softMax?'
      max: existingScrollable.scroll.max,
    },
  };

  const displacedSubject: Spacing =
    offsetByPosition(droppable.viewport.subject, scrollDisplacement);

  const clipped: ?Rect = closestScrollable.shouldClipSubject ?
    clip(frame, displacedSubject) :
    getRect(displacedSubject);

  const viewport: DroppableDimensionViewport = {
    closestScrollable,
    subject: droppable.viewport.subject,
    clipped,
  };

  const result: DroppableDimension = {
    ...droppable,
    viewport,
  };
  return result;
};

type GetDroppableArgs = {|
  descriptor: DroppableDescriptor,
  borderBox: Area,
  // optionally provided - and can also be null
  closest?: ?{|
    frameBorderBox: Area,
    scrollWidth: number,
    scrollHeight: number,
    scroll: Position,
    shouldClipSubject: boolean,
  |},
  direction?: Direction,
  margin?: Spacing,
  padding ?: Spacing,
  border?: Spacing,
  windowScroll?: Position,
  // Whether or not the droppable is currently enabled (can change at during a drag)
  // defaults to true
  isEnabled?: boolean,
|}

export const getDroppableDimension = ({
  descriptor,
  borderBox,
  closest,
  direction = 'vertical',
  isEnabled = true,
}: GetDroppableArgs): DroppableDimension => {
  throw new Error('Deprected');

  const marginBox: Area = getArea(expandBySpacing(borderBox, margin));
  const paddingBox: Area = getArea(shrinkBySpacing(borderBox, border));
  const contentBox: Area = getArea(shrinkBySpacing(paddingBox, padding));

  const client: BoxModel = {
    borderBox,
    marginBox,
    contentBox,
  };

  const page: BoxModel = {
    marginBox: getArea(offsetByPosition(marginBox, windowScroll)),
    borderBox: getArea(offsetByPosition(borderBox, windowScroll)),
    contentBox: getArea(offsetByPosition(contentBox, windowScroll)),
  };
  const subject: Area = page.marginBox;

  const closestScrollable: ?Scrollable = (() => {
    if (!closest) {
      return null;
    }

    const frame: Area = getArea(offsetByPosition(closest.frameBorderBox, windowScroll));

    const maxScroll: Position = getMaxScroll({
      scrollHeight: closest.scrollHeight,
      scrollWidth: closest.scrollWidth,
      height: frame.height,
      width: frame.width,
    });

    const result: Scrollable = {
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
    client,
    page,
    viewport,
  };

  return dimension;
};
