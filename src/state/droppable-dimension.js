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
import { subtract, negate } from './position';
import { offsetByPosition } from './spacing';
import getMaxScroll from './get-max-scroll';
import type {
  DroppableDimension,
  DroppableDescriptor,
  Scrollable,
  DroppableDimensionViewport,
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
  scrollHeight: number,
  scrollWidth: number,
  scroll: Position,
  shouldClipSubject: boolean,
|}

type GetDroppableArgs = {|
  descriptor: DroppableDescriptor,
  isEnabled: boolean,
  direction: 'vertical' | 'horizontal',
  client: BoxModel,
  page: BoxModel,
  closest?: ?Closest,
|}

const origin: Position = { x: 0, y: 0 };

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

    // scrollHeight and scrollWidth are based on the padding box
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
    const maxScroll: Position = getMaxScroll({
      scrollHeight: closest.scrollHeight,
      scrollWidth: closest.scrollWidth,
      height: closest.client.paddingBox.height,
      width: closest.client.paddingBox.width,
    });

    return {
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

  const clippedPageMarginBox: ?Rect = (scrollable && scrollable.shouldClipSubject) ?
    clip(scrollable.framePageMarginBox, subjectPageMarginBox) :
    subjectPageMarginBox;

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
    framePageMarginBox: scrollable.framePageMarginBox,
    shouldClipSubject: scrollable.shouldClipSubject,
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

  const displacedSubject: Spacing =
    offsetByPosition(droppable.viewport.subjectPageMarginBox, scrollDisplacement);

  const clippedPageMarginBox: ?Rect = closestScrollable.shouldClipSubject ?
    clip(framePageMarginBox, displacedSubject) :
    getRect(displacedSubject);

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

// TODO: make this work
// const growSubjectIfNeeded = ({
//   draggables: DraggableDimensionMap,
//   droppable: DroppableDimension,
//   addition: Position,
// }): DroppableDimension => {

// };

