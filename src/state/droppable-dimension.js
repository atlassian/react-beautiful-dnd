// @flow
import {
  getRect,
  type BoxModel,
  type Position,
  type Rect,
} from 'css-box-model';
import { vertical, horizontal } from './axis';
import type {
  DroppableDimension,
  DroppableDescriptor,
  Scrollable,
  DroppableDimensionViewport,
} from '../types';
import getMaxScroll from './get-max-scroll';

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

    const maxScroll: Position = getMaxScroll({
      // scrollHeight and scrollWidth are based on the padding box
      scrollHeight: closest.scrollHeight,
      scrollWidth: closest.scrollWidth,
      height: closest.client.paddingBox.height,
      width: closest.client.paddingBox.width,
    });

    return {
      frame: closest.page.borderBox,
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

  const subject: Rect = page.borderBox;

  const clipped: ?Rect = (scrollable && scrollable.shouldClipSubject) ?
    clip(scrollable.frame, subject) :
    subject;

  const viewport: DroppableDimensionViewport = {
    closestScrollable: scrollable,
    subject,
    clipped,
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

export const scrollDroppable = () => { };