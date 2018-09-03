// @flow
import invariant from 'tiny-invariant';
import {
  getRect,
  type BoxModel,
  type Position,
  type Rect,
  type Spacing,
} from 'css-box-model';
import { vertical, horizontal } from './axis';
import { subtract, negate, origin } from './position';
import { offsetByPosition } from './spacing';
import getMaxScroll from './get-max-scroll';
import type {
  Axis,
  DroppableDimension,
  DroppableDescriptor,
  Scrollable,
  DroppableSubject,
  ScrollSize,
} from '../types';

export const clip = (frame: Spacing, subject: Spacing): ?Rect => {
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

export type Closest = {|
  client: BoxModel,
  page: BoxModel,
  scroll: Position,
  scrollSize: ScrollSize,
  shouldClipSubject: boolean,
|};

type GetDroppableArgs = {|
  descriptor: DroppableDescriptor,
  isEnabled: boolean,
  isCombineEnabled: boolean,
  direction: 'vertical' | 'horizontal',
  client: BoxModel,
  page: BoxModel,
  closest?: ?Closest,
|};

type GetSubjectArgs = {|
  pageMarginBox: Rect,
  withPlaceholder: ?Position,
  axis: Axis,
  scrollDisplacement: Position,
  frame: ?Scrollable,
|};

const getSubject = ({
  pageMarginBox,
  withPlaceholder,
  axis,
  scrollDisplacement,
  frame,
}: GetSubjectArgs): DroppableSubject => {
  const scrolled: Spacing = offsetByPosition(pageMarginBox, scrollDisplacement);
  const expanded: Spacing = withPlaceholder
    ? {
        ...scrolled,
        [axis.end]: scrolled[axis.end] + withPlaceholder[axis.line],
      }
    : scrolled;
  const clipped: ?Rect =
    frame && frame.shouldClipSubject
      ? clip(frame.pageMarginBox, expanded)
      : getRect(expanded);

  return {
    pageMarginBox,
    withPlaceholder,
    active: clipped,
  };
};

export const getDroppableDimension = ({
  descriptor,
  isEnabled,
  isCombineEnabled,
  direction,
  client,
  page,
  closest,
}: GetDroppableArgs): DroppableDimension => {
  const frame: ?Scrollable = (() => {
    if (!closest) {
      return null;
    }

    const { scrollSize, client: frameClient } = closest;

    // scrollHeight and scrollWidth are based on the padding box
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
    const maxScroll: Position = getMaxScroll({
      scrollHeight: scrollSize.scrollHeight,
      scrollWidth: scrollSize.scrollWidth,
      height: frameClient.paddingBox.height,
      width: frameClient.paddingBox.width,
    });

    return {
      pageMarginBox: closest.page.marginBox,
      frameClient,
      scrollSize,
      shouldClipSubject: closest.shouldClipSubject,
      scroll: {
        initial: closest.scroll,
        current: closest.scroll,
        max: maxScroll,
        diff: {
          value: origin,
          displacement: origin,
        },
      },
    };
  })();

  const subjectPageMarginBox: Rect = page.marginBox;
  const axis: Axis = direction === 'vertical' ? vertical : horizontal;

  const subject: DroppableSubject = getSubject({
    pageMarginBox: subjectPageMarginBox,
    withPlaceholder: null,
    axis,
    scrollDisplacement: origin,
    frame,
  });

  const dimension: DroppableDimension = {
    descriptor,
    isCombineEnabled,
    axis,
    isEnabled,
    client,
    page,
    frame,
    subject,
  };

  return dimension;
};

export const withPlaceholder = (
  droppable: DroppableDimension,
  withPlaceholderSize: Position,
): DroppableDimension => {
  const frame: ?Scrollable = droppable.frame;

  if (!frame) {
    const subject: DroppableSubject = getSubject({
      pageMarginBox: droppable.subject.pageMarginBox,
      withPlaceholder: withPlaceholderSize,
      axis: droppable.axis,
      scrollDisplacement: origin,
      frame: droppable.frame,
    });
    return {
      ...droppable,
      subject,
    };
  }

  invariant(
    !droppable.subject.withPlaceholder,
    'Cannot add placeholder size to a subject when it already has one',
  );

  // Original max scroll with increased scroll size
  const maxScroll: Position = getMaxScroll({
    scrollHeight: frame.scrollSize.scrollHeight + withPlaceholderSize.y,
    scrollWidth: frame.scrollSize.scrollWidth + withPlaceholderSize.x,
    height: frame.frameClient.paddingBox.height,
    width: frame.frameClient.paddingBox.width,
  });

  const newFrame: Scrollable = {
    ...frame,
    scroll: {
      ...frame.scroll,
      max: maxScroll,
    },
  };

  const subject: DroppableSubject = getSubject({
    pageMarginBox: droppable.subject.pageMarginBox,
    withPlaceholder: withPlaceholderSize,
    axis: droppable.axis,
    scrollDisplacement: newFrame.scroll.diff.displacement,
    frame: newFrame,
  });
  return {
    ...droppable,
    subject,
    frame: newFrame,
  };
};

export const withoutPlaceholder = (
  droppable: DroppableDimension,
): DroppableDimension => {
  invariant(
    droppable.subject.withPlaceholder,
    'Cannot remove placeholder size from subject when there was none',
  );

  const frame: ?Scrollable = droppable.frame;

  if (!frame) {
    const subject: DroppableSubject = getSubject({
      pageMarginBox: droppable.subject.pageMarginBox,
      withPlaceholder: null,
      axis: droppable.axis,
      scrollDisplacement: origin,
      frame: droppable.frame,
    });
    return {
      ...droppable,
      subject,
    };
  }

  // Original max scroll
  const maxScroll: Position = getMaxScroll({
    scrollHeight: frame.scrollSize.scrollHeight,
    scrollWidth: frame.scrollSize.scrollWidth,
    height: frame.frameClient.paddingBox.height,
    width: frame.frameClient.paddingBox.width,
  });

  const newFrame: Scrollable = {
    ...frame,
    scroll: {
      ...frame.scroll,
      max: maxScroll,
    },
  };

  const subject: DroppableSubject = getSubject({
    pageMarginBox: droppable.subject.pageMarginBox,
    withPlaceholder: null,
    axis: droppable.axis,
    scrollDisplacement: newFrame.scroll.diff.displacement,
    frame: newFrame,
  });
  return {
    ...droppable,
    subject,
    frame: newFrame,
  };
};

export const scrollDroppable = (
  droppable: DroppableDimension,
  newScroll: Position,
): DroppableDimension => {
  invariant(droppable.frame);
  const scrollable: Scrollable = droppable.frame;

  const scrollDiff: Position = subtract(newScroll, scrollable.scroll.initial);
  // a positive scroll difference leads to a negative displacement
  // (scrolling down pulls an item upwards)
  const scrollDisplacement: Position = negate(scrollDiff);

  // Sometimes it is possible to scroll beyond the max point.
  // This can occur when scrolling a foreign list that now has a placeholder.

  const frame: Scrollable = {
    ...scrollable,
    scroll: {
      initial: scrollable.scroll.initial,
      current: newScroll,
      diff: {
        value: scrollDiff,
        displacement: scrollDisplacement,
      },
      // TODO: rename 'softMax?'
      max: scrollable.scroll.max,
    },
  };

  const subject: DroppableSubject = getSubject({
    pageMarginBox: droppable.subject.pageMarginBox,
    withPlaceholder: droppable.subject.withPlaceholder,
    axis: droppable.axis,
    scrollDisplacement,
    frame,
  });
  const result: DroppableDimension = {
    ...droppable,
    frame,
    subject,
  };
  return result;
};
