// @flow
import { type Rect } from 'css-box-model';
import {
  getDroppableDimension,
  getDraggableDimension,
} from '../../../util/dimension';
import { offsetRectByPosition } from '../../../../src/state/rect';
import type {
  DraggableDimension,
  DroppableDimension,
} from '../../../../src/types';

import getDroppableOver from '../../../../src/state/get-droppable-over';
import {
  getOffsetForCrossAxisEndEdge,
  getOffsetForCrossAxisStartEdge,
} from '../get-drag-impact/util/get-offset-for-edge';
import { toDroppableMap } from '../../../../src/state/dimension-structures';
import { beforeCrossAxisPoint } from '../../../util/before-point';
import { afterCrossAxisPoint } from '../../../util/after-point';

const droppableLarge: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'large',
    type: 'standard',
    mode: 'standard',
  },
  borderBox: {
    top: 0,
    left: 0,
    right: 400,
    bottom: 400,
  },
});

const droppableSmall: DroppableDimension = getDroppableDimension({
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

const draggable: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'my draggable',
    index: 0,
    type: droppableLarge.descriptor.type,
    droppableId: droppableLarge.descriptor.id,
  },
  borderBox: droppableLarge.client.borderBox,
});

it('should hit when dragging cross axis end edge is over the list center', () => {
  const offset = getOffsetForCrossAxisEndEdge({
    crossAxisEndEdgeOn: droppableSmall.page.borderBox.center,
    dragging: draggable.page.borderBox,
    axis: droppableSmall.axis,
  });

  {
    const pageBorderBox: Rect = offsetRectByPosition(
      draggable.page.borderBox,
      offset,
    );

    const result = getDroppableOver({
      pageBorderBox,
      draggable,
      droppables: toDroppableMap([droppableLarge, droppableSmall]),
      currentSelection: { x: 0, y: 0 },
      calculateDroppableUsingPointerPosition: false,
    });

    expect(result).toEqual(null);
  }

  {
    const pageBorderBox: Rect = offsetRectByPosition(
      draggable.page.borderBox,
      afterCrossAxisPoint(droppableSmall.axis, offset),
    );

    const result = getDroppableOver({
      pageBorderBox,
      draggable,
      droppables: toDroppableMap([droppableLarge, droppableSmall]),
      currentSelection: { x: 0, y: 0 },
      calculateDroppableUsingPointerPosition: false,
    });

    expect(result).toEqual(droppableSmall.descriptor.id);
  }
});

// For this test we are hitting draggableSmall from the (right side) cross axis side
it('should hit when dragging cross axis start edge is over the list center', () => {
  const offset = getOffsetForCrossAxisStartEdge({
    crossAxisStartEdgeOn: droppableSmall.page.borderBox.center,
    dragging: draggable.page.borderBox,
    axis: droppableSmall.axis,
  });

  {
    const pageBorderBox: Rect = offsetRectByPosition(
      draggable.page.borderBox,
      offset,
    );

    const result = getDroppableOver({
      pageBorderBox,
      draggable,
      droppables: toDroppableMap([droppableLarge, droppableSmall]),
      currentSelection: { x: 0, y: 0 },
      calculateDroppableUsingPointerPosition: false,
    });

    expect(result).toEqual(null);
  }

  {
    const pageBorderBox: Rect = offsetRectByPosition(
      draggable.page.borderBox,
      beforeCrossAxisPoint(droppableSmall.axis, offset),
    );

    const result = getDroppableOver({
      pageBorderBox,
      draggable,
      droppables: toDroppableMap([droppableLarge, droppableSmall]),
      currentSelection: { x: 0, y: 0 },
      calculateDroppableUsingPointerPosition: false,
    });

    expect(result).toEqual(droppableSmall.descriptor.id);
  }
});
