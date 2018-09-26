// @flow
import { getPreset, getDraggableDimension, makeScrollable } from './dimension';
import { offsetByPosition } from '../../src/state/spacing';
import getHomeLocation from '../../src/state/get-home-location';
import getHomeImpact from '../../src/state/get-home-impact';
import type {
  Critical,
  DropResult,
  DragStart,
  ClientPositions,
  DimensionMap,
  DraggableDimension,
  DroppableDimension,
  PendingDrop,
  Published,
} from '../../src/types';
import type {
  InitialPublishArgs,
  LiftArgs,
} from '../../src/state/action-creators';

// In case a consumer needs the references
export const preset = getPreset();
const scrollableHome: DroppableDimension = makeScrollable(preset.home);
const scrollableForeign: DroppableDimension = makeScrollable(preset.foreign);

export const critical: Critical = {
  draggable: preset.inHome1.descriptor,
  droppable: preset.home.descriptor,
};

const client: ClientPositions = {
  selection: preset.inHome1.client.borderBox.center,
  borderBoxCenter: preset.inHome1.client.borderBox.center,
  offset: { x: 0, y: 0 },
};

export const liftArgs: LiftArgs = {
  id: critical.draggable.id,
  client,
  viewport: preset.viewport,
  movementMode: 'FLUID',
};

export const initialPublishArgs: InitialPublishArgs = {
  critical,
  dimensions: preset.dimensions,
  client,
  viewport: preset.viewport,
  movementMode: 'FLUID',
};

export const initialPublishWithScrollables: InitialPublishArgs = {
  ...initialPublishArgs,
  dimensions: {
    draggables: preset.dimensions.draggables,
    droppables: {
      ...preset.dimensions.droppables,
      [scrollableHome.descriptor.id]: scrollableHome,
      [scrollableForeign.descriptor.id]: scrollableForeign,
    },
  },
};

export const publishAdditionArgs: Published = (() => {
  // home must be scrollable to publish changes to it
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
    removals: [],
    additions: [addition],
    modified: [scrollableHome],
  };
})();

export const getDragStart = (custom?: Critical = critical): DragStart => ({
  draggableId: custom.draggable.id,
  type: custom.droppable.type,
  source: getHomeLocation(custom.draggable),
  mode: 'FLUID',
});

export const completeDropArgs: DropResult = {
  ...getDragStart(critical),
  destination: getHomeLocation(critical.draggable),
  reason: 'DROP',
  combine: null,
};

export const animateDropArgs: PendingDrop = {
  newHomeOffset: { x: 10, y: 10 },
  impact: getHomeImpact(
    preset.dimensions.draggables[critical.draggable.id],
    preset.dimensions.droppables[critical.droppable.id],
  ),
  result: completeDropArgs,
  dropDuration: 1,
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
