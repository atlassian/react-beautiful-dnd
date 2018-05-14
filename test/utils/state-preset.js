// @flow
import type { Position } from 'css-box-model';
import type {
  IdleState,
  PreparingState,
  DraggingState,
  WindowDetails,
  ItemPositions,
  DragPositions,
  Viewport,
} from '../../src/types';
import { getPreset } from './dimension';
import noImpact from '../../src/state/no-impact';
import getViewport from '../../src/view/window/get-viewport';

const preset = getPreset();
const origin: Position = { x: 0, y: 0 };

export const idle: IdleState = { phase: 'IDLE' };
export const preparing: PreparingState = { phase: 'PREPARING' };

export const dragging = (): DraggingState => {
  const viewport: Viewport = getViewport();
  const windowDetails: WindowDetails = {
    viewport,
    scroll: {
      initial: viewport.scroll,
      current: viewport.scroll,
      diff: {
        value: origin,
        displacement: origin,
      },
    },
  };

  const client: ItemPositions = {
    selection: preset.inHome1.client.borderBox.center,
    borderBoxCenter: preset.inHome1.client.borderBox.center,
    offset: { x: 0, y: 0 },
  };

  const initial: DragPositions = {
    client,
    page: client,
  };

  const result: DraggingState = {
    phase: 'DRAGGING',
    critical: {
      draggable: preset.inHome1.descriptor,
      droppable: preset.home.descriptor,
    },
    autoScrollMode: 'FLUID',
    dimensions: preset.dimensions,
    initial,
    current: initial,
    impact: noImpact,
    window: windowDetails,
    scrollJumpRequest: null,
    shouldAnimate: true,
  };

  return result;
};

