// @flow
import { getRect, type Rect, type Spacing } from 'css-box-model';
import type {
  Axis,
  Scrollable,
  DroppableSubject,
  PlaceholderInSubject,
} from '../../../types';
import executeClip from './clip';
import { offsetByPosition } from '../../spacing';

const scroll = (target: Spacing, frame: ?Scrollable): Spacing => {
  if (!frame) {
    return target;
  }

  return offsetByPosition(target, frame.scroll.diff.displacement);
};

const increase = (
  target: Spacing,
  axis: Axis,
  withPlaceholder: ?PlaceholderInSubject,
): Spacing => {
  if (withPlaceholder && withPlaceholder.increasedBy) {
    return {
      ...target,
      [axis.end]: target[axis.end] + withPlaceholder.increasedBy[axis.line],
    };
  }
  return target;
};

const clip = (target: Spacing, frame: ?Scrollable): ?Rect => {
  if (frame && frame.shouldClipSubject) {
    return executeClip(frame.pageMarginBox, target);
  }
  return getRect(target);
};

type Args = {|
  pageMarginBox: Rect,
  withPlaceholder: ?PlaceholderInSubject,
  axis: Axis,
  frame: ?Scrollable,
|};

export default ({
  pageMarginBox,
  withPlaceholder,
  axis,
  frame,
}: Args): DroppableSubject => {
  const scrolled: Spacing = scroll(pageMarginBox, frame);
  const increased: Spacing = increase(scrolled, axis, withPlaceholder);
  const clipped: ?Rect = clip(increased, frame);

  return {
    pageMarginBox,
    withPlaceholder,
    active: clipped,
  };
};
