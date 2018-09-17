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
import getMaxScroll from '../get-max-scroll';
import { add, origin, patch } from '../position';
import getSubject from './util/get-subject';

const getRequiredGrowthForPlaceholder = (
  droppable: DroppableDimension,
  withPlaceholderSize: Position,
  draggables: DraggableDimensionMap,
): ?Position => {
  const axis: Axis = droppable.axis;
  // TODO: margin collapsing?
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
  };

  if (!frame) {
    const subject: DroppableSubject = getSubject({
      pageMarginBox: droppable.subject.pageMarginBox,
      withPlaceholder: growBy,
      axis: droppable.axis,
      scrollDisplacement: origin,
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

  const newFrame: Scrollable = {
    ...frame,
    scroll: {
      ...frame.scroll,
      max: maxScroll,
    },
  };

  const subject: DroppableSubject = getSubject({
    pageMarginBox: droppable.subject.pageMarginBox,
    withPlaceholder: growBy,
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
  // TODO: should just store this somewhere?
  /*
    scroll: {
      // then we can just revert to this
      originalMax: Position

    }
  */
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
