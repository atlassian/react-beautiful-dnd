// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import type {
  Axis,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  Scrollable,
  DroppableSubject,
  PlaceholderInSubject,
} from '../../types';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import { add, patch } from '../position';
import getSubject from './util/get-subject';

export const getRequiredGrowthForPlaceholder = (
  droppable: DroppableDimension,
  withPlaceholderSize: Position,
  draggables: DraggableDimensionMap,
): ?Position => {
  const axis: Axis = droppable.axis;
  // TODO: consider margin collapsing?
  const availableSpace: number = droppable.subject.pageMarginBox[axis.size];
  const insideDroppable: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable,
    draggables,
  );
  const spaceUsed: number = insideDroppable.reduce(
    (sum: number, dimension: DraggableDimension): number =>
      sum + dimension.client.marginBox[axis.size],
    0,
  );
  const requiredSpace: number = spaceUsed + withPlaceholderSize[axis.line];
  const needsToGrowBy: number = requiredSpace - availableSpace;

  // nothing to do here
  if (needsToGrowBy <= 0) {
    return null;
  }

  return patch(axis.line, needsToGrowBy);
};

const withMaxScroll = (frame: Scrollable, max: Position): Scrollable => ({
  ...frame,
  scroll: {
    ...frame.scroll,
    max,
  },
});

export const withPlaceholder = (
  droppable: DroppableDimension,
  withPlaceholderSize: Position,
  draggables: DraggableDimensionMap,
): DroppableDimension => {
  const frame: ?Scrollable = droppable.frame;

  invariant(
    !droppable.subject.withPlaceholder,
    'Cannot add placeholder size to a subject when it already has one',
  );

  const requiredGrowth: ?Position = getRequiredGrowthForPlaceholder(
    droppable,
    withPlaceholderSize,
    draggables,
  );

  const growBy: PlaceholderInSubject = {
    placeholderSize: withPlaceholderSize,
    increasedBy: requiredGrowth,
    oldFrameMaxScroll: droppable.frame ? droppable.frame.scroll.max : null,
  };

  if (!frame) {
    const subject: DroppableSubject = getSubject({
      pageMarginBox: droppable.subject.pageMarginBox,
      withPlaceholder: growBy,
      axis: droppable.axis,
      frame: droppable.frame,
    });
    return {
      ...droppable,
      subject,
    };
  }

  const maxScroll: Position = requiredGrowth
    ? add(frame.scroll.max, requiredGrowth)
    : frame.scroll.max;

  const newFrame: Scrollable = withMaxScroll(frame, maxScroll);

  const subject: DroppableSubject = getSubject({
    pageMarginBox: droppable.subject.pageMarginBox,
    withPlaceholder: growBy,
    axis: droppable.axis,
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
    'Cannot remove placeholder form subject when there was none',
  );

  const frame: ?Scrollable = droppable.frame;

  if (!frame) {
    const subject: DroppableSubject = getSubject({
      pageMarginBox: droppable.subject.pageMarginBox,
      withPlaceholder: null,
      axis: droppable.axis,
      frame: droppable.frame,
    });
    return {
      ...droppable,
      subject,
    };
  }

  const oldMaxScroll: Position = withPlaceholder.oldFrameMaxScroll;
  invariant(
    oldMaxScroll,
    'Expected droppable to have old frame scroll when removing placeholder',
  );

  const newFrame: Scrollable = withMaxScroll(frame, oldMaxScroll);

  const subject: DroppableSubject = getSubject({
    pageMarginBox: droppable.subject.pageMarginBox,
    withPlaceholder: null,
    axis: droppable.axis,
    frame: newFrame,
  });
  return {
    ...droppable,
    subject,
    frame: newFrame,
  };
};
