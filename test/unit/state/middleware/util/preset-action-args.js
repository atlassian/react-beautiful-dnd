// @flow
import type { Position } from 'css-box-model';
import { getPreset } from '../../../../utils/dimension';
import getViewport from '../../../../../src/view/window/get-viewport';
import type {
  Critical,
  DragStart,
  Viewport,
  DraggableLocation,
} from '../../../../../src/types';
import type {
  InitialPublishArgs,
  BulkReplaceArgs,

} from '../../../../../src/state/action-creators';

const preset = getPreset();
const origin: Position = { x: 0, y: 0 };

const base: Viewport = getViewport();
export const viewport: Viewport = {
  frame: base.frame,
  scroll: {
    initial: preset.windowScroll,
    current: preset.windowScroll,
    max: base.scroll.max,
    diff: {
      value: origin,
      displacement: origin,
    },
  },
};

export const initialPublishArgs: InitialPublishArgs = {
  critical: {
    draggable: preset.inHome1.descriptor,
    droppable: preset.home.descriptor,
  },
  dimensions: preset.dimensions,
  client: {
    selection: preset.inHome1.client.borderBox.center,
    borderBoxCenter: preset.inHome1.client.borderBox.center,
    offset: { x: 0, y: 0 },
  },
  viewport,
  autoScrollMode: 'FLUID',
};

export const initialBulkReplaceArgs: BulkReplaceArgs = {
  dimensions: preset.dimensions,
  viewport,
  critical: null,
};

export const getHomeLocation = (critical: Critical): DraggableLocation => ({
  droppableId: critical.droppable.id,
  index: critical.draggable.index,
});

export const getDragStart = (critical: Critical): DragStart => ({
  draggableId: critical.draggable.id,
  type: critical.droppable.type,
  source: getHomeLocation(critical),
});
