// @flow
import { getPreset, getDraggableDimension } from './dimension';
import { offsetByPosition } from '../../src/state/spacing';
import getHomeLocation from '../../src/state/get-home-location';
import getHomeImpact from '../../src/state/get-home-impact';
import type {
  Critical,
  DropResult,
  DragStart,
  ItemPositions,
  DimensionMap,
  Publish,
  DraggableDimension,
  PendingDrop,
} from '../../src/types';
import type {
  InitialPublishArgs,
  LiftArgs,
} from '../../src/state/action-creators';

// In case a consumer needs the references
export const preset = getPreset();

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
  viewport: preset.viewport,
  autoScrollMode: 'FLUID',
};

export const initialPublishArgs: InitialPublishArgs = {
  critical,
  dimensions: preset.dimensions,
  client,
  viewport: preset.viewport,
  autoScrollMode: 'FLUID',
};

export const publishAdditionArgs: Publish = (() => {
  const addition: DraggableDimension = getDraggableDimension({
    descriptor: {
      ...preset.inHome4.descriptor,
      // adding to the end of the list
      index: preset.inHomeList.length,
      id: 'addition',
    },
    borderBox: offsetByPosition(preset.inHome4.client.borderBox, {
      x: 0,
      y: preset.inHome4.client.borderBox.height,
    }),
    windowScroll: preset.windowScroll,
  });
  return {
    removals: {
      draggables: [],
      droppables: [],
    },
    additions: {
      draggables: [addition],
      droppables: [],
    },
  };
})();

export const getDragStart = (custom?: Critical = critical): DragStart => ({
  draggableId: custom.draggable.id,
  type: custom.droppable.type,
  source: getHomeLocation(custom),
});

export const completeDropArgs: DropResult = {
  ...getDragStart(critical),
  destination: getHomeLocation(critical),
  reason: 'DROP',
};

export const animateDropArgs: PendingDrop = {
  newHomeOffset: { x: 10, y: 10 },
  impact: getHomeImpact(critical, preset.dimensions),
  result: completeDropArgs,
};

export const userCancelArgs: PendingDrop = {
  ...animateDropArgs,
  result: {
    ...completeDropArgs,
    reason: 'CANCEL',
  },
};

export const copy = (dimensions: DimensionMap): DimensionMap => ({
  droppables: {
    ...dimensions.droppables,
  },
  draggables: {
    ...dimensions.draggables,
  },
});
