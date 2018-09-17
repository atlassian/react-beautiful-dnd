// @flow
import { getRect, type Position, type Rect, type Spacing } from 'css-box-model';
import type {
  Axis,
  Scrollable,
  DroppableSubject,
  PlaceholderInSubject,
} from '../../../types';
import clip from './clip';
import { offsetByPosition } from '../../spacing';

type Args = {|
  pageMarginBox: Rect,
  withPlaceholder: ?PlaceholderInSubject,
  axis: Axis,
  scrollDisplacement: Position,
  frame: ?Scrollable,
|};

export default ({
  pageMarginBox,
  withPlaceholder,
  axis,
  scrollDisplacement,
  frame,
}: Args): DroppableSubject => {
  const scrolled: Spacing = offsetByPosition(pageMarginBox, scrollDisplacement);
  const maybeIncreased: Spacing =
    withPlaceholder && withPlaceholder.increasedBy
      ? {
          ...scrolled,
          [axis.end]:
            scrolled[axis.end] + withPlaceholder.increasedBy[axis.line],
        }
      : scrolled;
  const maybeClipped: ?Rect =
    frame && frame.shouldClipSubject
      ? clip(frame.pageMarginBox, maybeIncreased)
      : getRect(maybeIncreased);

  return {
    pageMarginBox,
    withPlaceholder,
    active: maybeClipped,
  };
};
