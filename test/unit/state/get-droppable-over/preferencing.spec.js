// @flow
import { type Position, type Rect, getRect } from 'css-box-model';
import {
  disableDroppable,
  getDroppableDimension,
  getPreset,
  getDraggableDimension,
} from '../../../util/dimension';
import { subtract, patch } from '../../../../src/state/position';
import { offsetRectByPosition } from '../../../../src/state/rect';
import type {
  TypeId,
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
} from '../../../../src/types';

import getDroppableOver from '../../../../src/state/get-droppable-over';
import {
  getOffsetForEndEdge,
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

const droppableSmallSecondary: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'secondary',
    type: 'standard',
    mode: 'standard',
  },
  borderBox: {
    top: 1000,
    left: 1200,
    right: 1300,
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

it('should prefer lists that are further away in the case that multiple lists are hit', () => {
  const target: Position = droppableSmallSecondary.page.borderBox.center;
  const distance: Position = subtract(target, draggable.page.borderBox.center);

  const startEdge: Position = patch(
    droppableSmallSecondary.axis.line,
    droppableSmallSecondary.page.borderBox[
      droppableSmallSecondary.axis.crossAxisStart
    ],
    droppableSmallSecondary.page.borderBox.center[
      droppableSmallSecondary.axis.line
    ],
  );

  const offset = getOffsetForCrossAxisStartEdge({
    crossAxisStartEdgeOn: startEdge,
    dragging: draggable.page.borderBox,
    axis: droppableSmallSecondary.axis,
  });

  const pageBorderBox: Rect = offsetRectByPosition(
    draggable.page.borderBox,
    offset,
  );

  const result = getDroppableOver({
    pageBorderBox,
    draggable,
    droppables: toDroppableMap([
      droppableLarge,
      droppableSmall,
      droppableSmallSecondary,
    ]),
  });

  expect(result).toEqual('secondary');
});
