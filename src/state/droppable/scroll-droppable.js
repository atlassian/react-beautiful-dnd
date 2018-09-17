// @flow
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import type {
  DroppableDimension,
  Scrollable,
  DroppableSubject,
} from '../../types';
import { negate, subtract } from '../position';
import getSubject from './util/get-subject';

export default (
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
