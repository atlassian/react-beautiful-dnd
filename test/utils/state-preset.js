// @flow
import type { Position } from 'css-box-model';
import type {
  IdleState,
  PreparingState,
  DraggingState,
  ItemPositions,
  BulkCollectionState,
  DragPositions,
  Viewport,
  Critical,
    DropPendingState,
    DropReason,
} from '../../src/types';
import { getPreset } from './dimension';
import getViewport from '../../src/view/window/get-viewport';
import getHomeImpact from '../../src/state/get-home-impact';

const preset = getPreset();

export const idle: IdleState = { phase: 'IDLE' };
export const preparing: PreparingState = { phase: 'PREPARING' };
export const critical: Critical = {
  draggable: preset.inHome1.descriptor,
  droppable: preset.home.descriptor,
};

export const dragging = (): DraggingState => {
  const viewport: Viewport = getViewport();

  const client: ItemPositions = {
    selection: preset.inHome1.client.borderBox.center,
    borderBoxCenter: preset.inHome1.client.borderBox.center,
    offset: { x: 0, y: 0 },
  };
  const page: ItemPositions = {
    selection: preset.inHome1.page.borderBox.center,
    borderBoxCenter: preset.inHome1.page.borderBox.center,
    offset: { x: 0, y: 0 },
  };

  const initial: DragPositions = {
    client,
    page,
  };

  const result: DraggingState = {
    phase: 'DRAGGING',
    critical,
    autoScrollMode: 'FLUID',
    dimensions: preset.dimensions,
    initial,
    current: initial,
    impact: getHomeImpact(critical, preset.dimensions),
    viewport,
    scrollJumpRequest: null,
    shouldAnimate: true,
  };

  return result;
};

export const bulkCollecting = (): BulkCollectionState => ({
  phase: 'BULK_COLLECTING',
  ...dragging(),
  // eslint-disable-next-line
  phase: 'BULK_COLLECTING',
});

type DropPendingArgs = {
  reason: DropReason,
  isWaiting: boolean,
};

const defaultDropPending: DropPendingArgs = {
  reason: 'DROP',
  isWaiting: true,
};

export const dropPending = (args: ?DropPendingArgs = defaultDropPending): DropPendingState => ({
  phase: 'DROP_PENDING',
  ...dragging(),
  // eslint-disable-next-line
  phase: 'DROP_PENDING',
  ...args,
});

