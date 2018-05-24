// @flow
import { getRect, type Rect, type Position } from 'css-box-model';
import { getPreset } from './dimension';
import getViewport from '../../src/view/window/get-viewport';
import { offsetByPosition } from '../../src/state/spacing';
import type {
  Critical,
  DragStart,
  DraggableLocation,
  ItemPositions,
  Viewport,
  DimensionMap,
} from '../../src/types';
import type{
  InitialPublishArgs,
  BulkReplaceArgs,
  LiftArgs,
} from '../../src/state/action-creators';

const preset = getPreset();
const origin: Position = { x: 0, y: 0 };

export const viewport: Viewport = (() => {
  const initial: Viewport = getViewport();
  const shifted: Rect = getRect(offsetByPosition(initial.frame, preset.windowScroll));

  return {
    frame: shifted,
    scroll: {
      initial: preset.windowScroll,
      current: preset.windowScroll,
      max: initial.scroll.max,
      diff: {
        value: origin,
        displacement: origin,
      },
    },
  };
})();

export const critical: Critical = {
  draggable: preset.inHome1.descriptor,
  droppable: preset.home.descriptor,
};

const client: ItemPositions = {
  selection: preset.inHome1.client.borderBox.center,
  borderBoxCenter: preset.inHome1.client.borderBox.center,
  offset: { x: 0, y: 0 },
};

export const liftArgs: LiftArgs = {
  id: critical.draggable.id,
  client,
  viewport,
  autoScrollMode: 'FLUID',
};

export const criticalDimensions: DimensionMap = {
  draggables: {
    [critical.draggable.id]: preset.inHome1,
  },
  droppables: {
    [preset.home.descriptor.id]: preset.home,
  },
};

export const initialPublishArgs: InitialPublishArgs = {
  critical,
  dimensions: criticalDimensions,
  client,
  viewport,
  autoScrollMode: 'FLUID',
};

export const copy = (dimensions: DimensionMap): DimensionMap => ({
  droppables: {
    ...dimensions.droppables,
  },
  draggables: {
    ...dimensions.draggables,
  },
});

export const withoutCritical: DimensionMap = (() => {
  const result: DimensionMap = copy(preset.dimensions);
  delete result.draggables[critical.draggable.id];
  delete result.droppables[critical.droppable.id];

  return result;
})();

export const initialBulkReplaceArgs: BulkReplaceArgs = {
  dimensions: withoutCritical,
  viewport,
  critical: null,
};

export const getHomeLocation = (custom?: Critical = critical): DraggableLocation => ({
  droppableId: custom.droppable.id,
  index: custom.draggable.index,
});

export const getDragStart = (custom?: Critical = critical): DragStart => ({
  draggableId: custom.draggable.id,
  type: custom.droppable.type,
  source: getHomeLocation(custom),
});
