// @flow
import { type Position, type Rect } from 'css-box-model';
import {
  getDroppableDimension,
  getDraggableDimension,
} from '../../../util/dimension';
import { patch } from '../../../../src/state/position';
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
    right: 600,
    bottom: 600,
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

const axis = droppableSmall.axis;

const draggable: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'my draggable',
    index: 0,
    type: droppableLarge.descriptor.type,
    droppableId: droppableLarge.descriptor.id,
  },
  borderBox: droppableLarge.client.borderBox,
});

it('should hit when dragging element completely covers the list (end edge +1)', () => {
  const endEdge: Position = patch(
    axis.line,
    droppableSmall.page.borderBox[axis.crossAxisEnd],
    droppableSmall.page.borderBox.center[axis.line],
  );

  const offset = getOffsetForCrossAxisEndEdge({
    crossAxisEndEdgeOn: endEdge,
    dragging: draggable.page.borderBox,
    axis: droppableSmall.axis,
  });

  // we do not have overlap yet
  {
    const pageBorderBox: Rect = offsetRectByPosition(
      draggable.page.borderBox,
      offset,
    );

    const result = getDroppableOver({
      pageBorderBox,
      draggable,
      droppables: toDroppableMap([droppableLarge, droppableSmall]),
    });

    expect(result).toEqual(null);
  }

  // we have overlap
  {
    const pageBorderBox: Rect = offsetRectByPosition(
      draggable.page.borderBox,
      afterCrossAxisPoint(droppableSmall.axis, offset),
    );

    const result = getDroppableOver({
      pageBorderBox,
      draggable,
      droppables: toDroppableMap([droppableLarge, droppableSmall]),
    });

    expect(result).toEqual(droppableSmall.descriptor.id);
  }
});

it('should hit when dragging element completely covers the list (start edge -1)', () => {
  const startEdge: Position = patch(
    axis.line,
    droppableSmall.page.borderBox[axis.crossAxisStart],
    droppableSmall.page.borderBox.center[axis.line],
  );

  const offset = getOffsetForCrossAxisStartEdge({
    crossAxisStartEdgeOn: startEdge,
    dragging: draggable.page.borderBox,
    axis: droppableSmall.axis,
  });

  // we do not have overlap yet
  {
    const pageBorderBox: Rect = offsetRectByPosition(
      draggable.page.borderBox,
      offset,
    );

    const result = getDroppableOver({
      pageBorderBox,
      draggable,
      droppables: toDroppableMap([droppableLarge, droppableSmall]),
    });

    expect(result).toEqual(null);
  }

  // we have overlap
  {
    const pageBorderBox: Rect = offsetRectByPosition(
      draggable.page.borderBox,
      beforeCrossAxisPoint(droppableSmall.axis, offset),
    );

    const result = getDroppableOver({
      pageBorderBox,
      draggable,
      droppables: toDroppableMap([droppableLarge, droppableSmall]),
    });

    expect(result).toEqual(droppableSmall.descriptor.id);
  }
});
