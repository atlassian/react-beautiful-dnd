// @flow
import { type Position, type Rect, getRect } from 'css-box-model';
import {
  disableDroppable,
  getDroppableDimension,
  getPreset,
  getDraggableDimension,
} from '../../../util/dimension';
import { subtract, patch } from '../../../../src/state/position';
import getDroppableOver from '../../../../src/state/get-droppable-over';
import { offsetRectByPosition } from '../../../../src/state/rect';
import type {
  TypeId,
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
} from '../../../../src/types';

const type: TypeId = 'standard';
const droppableId: DroppableId = 'list';

const dragging: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'dragging',
    index: 0,
    type,
    droppableId,
  },
  borderBox: {
    top: 20,
    left: 20,
    right: 60,
    bottom: 60,
  },
});

it('should hit when inside subject, but outside the frame', () => {
  const droppable: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: droppableId,
      type,
      mode: 'standard',
    },
    borderBox: {
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    },
    closest: {
      borderBox: {
        top: 0,
        left: 0,
        right: 50,
        bottom: 50,
      },
      scrollSize: {
        scrollHeight: 100,
        scrollWidth: 100,
      },
      scroll: { x: 0, y: 0 },
      shouldClipSubject: true,
    },
  });
  const target: Position = { x: 20, y: 20 };
  const distance: Position = subtract(target, dragging.page.borderBox.center);

  const pageBorderBox: Rect = offsetRectByPosition(
    dragging.page.borderBox,
    distance,
  );

  const result: ?DroppableId = getDroppableOver({
    pageBorderBox,
    draggable: dragging,
    droppables: { [droppableId]: droppable },
  });

  expect(result).toBe(droppableId);
});

it('should not hit when inside subject, but outside the frame', () => {
  const droppable: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: droppableId,
      type,
      mode: 'standard',
    },
    borderBox: {
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    },
    closest: {
      borderBox: {
        top: 0,
        left: 0,
        right: 50,
        bottom: 50,
      },
      scrollSize: {
        scrollHeight: 100,
        scrollWidth: 100,
      },
      scroll: { x: 0, y: 0 },
      shouldClipSubject: true,
    },
  });
  const target: Position = { x: 60, y: 60 };
  const distance: Position = subtract(target, dragging.page.borderBox.center);

  const pageBorderBox: Rect = offsetRectByPosition(
    dragging.page.borderBox,
    distance,
  );

  const result: ?DroppableId = getDroppableOver({
    pageBorderBox,
    draggable: dragging,
    droppables: { [droppableId]: droppable },
  });

  expect(result).toBe(null);
});

it('should not hit when outside subject and inside the frame (partially visible subject)', () => {
  const droppable: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: droppableId,
      type,
      mode: 'standard',
    },
    borderBox: {
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    },
    closest: {
      borderBox: {
        top: 0,
        left: 0,
        right: 200,
        bottom: 200,
      },
      scrollSize: {
        scrollHeight: 200,
        scrollWidth: 200,
      },
      scroll: { x: 0, y: 0 },
      shouldClipSubject: true,
    },
  });
  const target: Position = { x: 120, y: 120 };
  const distance: Position = subtract(target, dragging.page.borderBox.center);

  const pageBorderBox: Rect = offsetRectByPosition(
    dragging.page.borderBox,
    distance,
  );

  const result: ?DroppableId = getDroppableOver({
    pageBorderBox,
    draggable: dragging,
    droppables: { [droppableId]: droppable },
  });

  expect(result).toBe(null);
});

it('should not hit when outside subject and inside the frame (invisible subject)', () => {
  const droppable: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: droppableId,
      type,
      mode: 'standard',
    },
    borderBox: {
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    },
    closest: {
      borderBox: {
        top: 0,
        left: 0,
        right: 200,
        bottom: 200,
      },
      scrollSize: {
        scrollHeight: 250,
        scrollWidth: 250,
      },
      scroll: { x: 200, y: 200 },
      shouldClipSubject: true,
    },
  });
  const target: Position = { x: 250, y: 250 };
  const distance: Position = subtract(target, dragging.page.borderBox.center);

  const pageBorderBox: Rect = offsetRectByPosition(
    dragging.page.borderBox,
    distance,
  );

  const result: ?DroppableId = getDroppableOver({
    pageBorderBox,
    draggable: dragging,
    droppables: { [droppableId]: droppable },
  });

  expect(result).toBe(null);
});
