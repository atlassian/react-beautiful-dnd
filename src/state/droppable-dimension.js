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
  DroppableDimension,
  DroppableDescriptor,
  Scrollable,
  DroppableDimensionViewport,
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
  direction: 'vertical' | 'horizontal',
  client: BoxModel,
  page: BoxModel,
  closest?: ?Closest,
|};

export const getDroppableDimension = ({
  descriptor,
  isEnabled,
  direction,
  client,
  page,
  closest,
}: GetDroppableArgs): DroppableDimension => {
  const scrollable: ?Scrollable = (() => {
    if (!closest) {
      return null;
    }

    const { scrollSize, client: frameClient } = closest;

    // scrollHeight and scrollWidth are based on the padding box
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
    const maxScroll: Position = getMaxScroll({
      // size of the content
      scrollHeight: scrollSize.scrollHeight,
      scrollWidth: scrollSize.scrollWidth,
      // actual dimensions of the frame
      height: frameClient.paddingBox.height,
      width: frameClient.paddingBox.width,
    });

    return {
      frameClient,
      scrollSize,
      framePageMarginBox: closest.page.marginBox,
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

  const clippedPageMarginBox: ?Rect =
    scrollable && scrollable.shouldClipSubject
      ? clip(scrollable.framePageMarginBox, subjectPageMarginBox)
      : subjectPageMarginBox;

  const viewport: DroppableDimensionViewport = {
    closestScrollable: scrollable,
    subjectPageMarginBox,
    clippedPageMarginBox,
  };

  const dimension: DroppableDimension = {
    descriptor,
    axis: direction === 'vertical' ? vertical : horizontal,
    isEnabled,
    client,
    page,
    viewport,
  };

  return dimension;
};

export const scrollDroppable = (
  droppable: DroppableDimension,
  newScroll: Position,
): DroppableDimension => {
  invariant(droppable.viewport.closestScrollable);

  const scrollable: Scrollable = droppable.viewport.closestScrollable;
  const framePageMarginBox: Rect = scrollable.framePageMarginBox;

  const scrollDiff: Position = subtract(newScroll, scrollable.scroll.initial);
  // a positive scroll difference leads to a negative displacement
  // (scrolling down pulls an item upwards)
  const scrollDisplacement: Position = negate(scrollDiff);

  // Sometimes it is possible to scroll beyond the max point.
  // This can occur when scrolling a foreign list that now has a placeholder.

  const closestScrollable: Scrollable = {
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

  const displacedSubject: Spacing = offsetByPosition(
    droppable.viewport.subjectPageMarginBox,
    scrollDisplacement,
  );

  const clippedPageMarginBox: ?Rect = closestScrollable.shouldClipSubject
    ? clip(framePageMarginBox, displacedSubject)
    : getRect(displacedSubject);

  const viewport: DroppableDimensionViewport = {
    closestScrollable,
    subjectPageMarginBox: droppable.viewport.subjectPageMarginBox,
    clippedPageMarginBox,
  };

  const result: DroppableDimension = {
    ...droppable,
    viewport,
  };
  return result;
};
