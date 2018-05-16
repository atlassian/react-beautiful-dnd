// @flow
import { getPreset } from '../../../../utils/dimension';
import getViewport from '../../../../../src/view/window/get-viewport';
import type {
  Critical,
  DragStart,
  Viewport,
} from '../../../../../src/types';
import type {
  InitialPublishArgs,
  BulkReplaceArgs,

} from '../../../../../src/state/action-creators';

const preset = getPreset();

export const viewport: Viewport = {
  ...getViewport(),
  scroll: preset.windowScroll,
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

export const getDragStart = (critical: Critical): DragStart => ({
  draggableId: critical.draggable.id,
  type: critical.droppable.type,
  source: {
    droppableId: critical.droppable.id,
    index: critical.draggable.index,
  },
});
