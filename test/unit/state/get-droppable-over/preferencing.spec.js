// @flow
import { type Rect } from 'css-box-model';
import {
  getDroppableDimension,
  getDraggableDimension,
} from '../../../util/dimension';
import type {
  DraggableDimension,
  DroppableDimension,
} from '../../../../src/types';
import { getOffsetForCrossAxisEndEdge } from '../get-drag-impact/util/get-offset-for-edge';
import { offsetRectByPosition } from '../../../../src/state/rect';
import getDroppableOver from '../../../../src/state/get-droppable-over';
import { toDroppableMap } from '../../../../src/state/dimension-structures';
import { afterCrossAxisPoint } from '../../../util/after-point';

const droppableOrigin: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'large',
    type: 'standard',
    mode: 'standard',
  },
  borderBox: {
    top: 0,
    left: 0,
    right: 600,
    bottom: 600,
  },
});

const droppableFirst: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'small',
    type: 'standard',
    mode: 'standard',
  },
  borderBox: {
    top: 1000,
    left: 1000,
    right: 1100,
    bottom: 1100,
  },
});

const droppableSecond: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'secondary',
    type: 'standard',
    mode: 'standard',
  },
  borderBox: {
    top: 1000,
    left: 1200,
    right: 1300,
    // This is really tall to test the distance calculation against varied lists
    bottom: 8000,
  },
});

const droppableThird: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'tertiary',
    type: 'standard',
    mode: 'standard',
  },
  borderBox: {
    top: 1000,
    left: 1400,
    right: 1500,
    bottom: 1100,
  },
});

const draggable: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'my draggable',
    index: 0,
    type: droppableOrigin.descriptor.type,
    droppableId: droppableOrigin.descriptor.id,
  },
  borderBox: droppableOrigin.client.borderBox,
});

/**
 * In this case we're hovering over all three lists.
 * We expect that the furthest away active element is returned.
 */
it('should prefer the furthest away droppable when multiple lists are hit', () => {
  const offset = getOffsetForCrossAxisEndEdge({
    crossAxisEndEdgeOn: droppableThird.page.borderBox.center,
    dragging: draggable.page.borderBox,
    axis: droppableThird.axis,
  });

  const pageBorderBox: Rect = offsetRectByPosition(
    draggable.page.borderBox,
    afterCrossAxisPoint(droppableThird.axis, offset),
  );

  const result = getDroppableOver({
    pageBorderBox,
    draggable,
    droppables: toDroppableMap([
      droppableOrigin,
      droppableFirst,
      droppableSecond,
      droppableThird,
    ]),
  });

  expect(result).toEqual(droppableThird.descriptor.id);
});

/**
 * In this case we're hovering over the primary and secondary and lists.
 * We expect that the furthest away active element is returned (not including the tertiary list).
 */
it('should prefer the second furthest away droppable when multiple lists are hit', () => {
  const offset = getOffsetForCrossAxisEndEdge({
    crossAxisEndEdgeOn: droppableSecond.page.borderBox.center,
    dragging: draggable.page.borderBox,
    axis: droppableSecond.axis,
  });

  const pageBorderBox: Rect = offsetRectByPosition(
    draggable.page.borderBox,
    afterCrossAxisPoint(droppableSecond.axis, offset),
  );

  const result = getDroppableOver({
    pageBorderBox,
    draggable,
    droppables: toDroppableMap([
      droppableOrigin,
      droppableFirst,
      droppableSecond,
      droppableThird,
    ]),
  });

  expect(result).toEqual(droppableSecond.descriptor.id);
});
