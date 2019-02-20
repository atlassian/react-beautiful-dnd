// @flow
import type { Position } from 'css-box-model';
import type {
  Critical,
  DropResult,
  DragStart,
  DimensionMap,
  DraggableDimension,
  DroppableDimension,
  Published,
} from '../../src/types';
import type {
  InitialPublishArgs,
  LiftArgs,
} from '../../src/state/action-creators';
import { getPreset, getDraggableDimension, makeScrollable } from './dimension';
import { offsetByPosition } from '../../src/state/spacing';
import getHomeLocation from '../../src/state/get-home-location';
import getHomeOnLift from '../../src/state/get-home-on-lift';

// In case a consumer needs the references
export const preset = getPreset();
const scrollableHome: DroppableDimension = makeScrollable(preset.home);
const scrollableForeign: DroppableDimension = makeScrollable(preset.foreign);

export const critical: Critical = {
  draggable: preset.inHome1.descriptor,
  droppable: preset.home.descriptor,
};

export const { onLift, impact: homeImpact } = getHomeOnLift({
  draggable: preset.inHome1,
  draggables: preset.draggables,
  home: preset.home,
  viewport: preset.viewport,
});

const clientSelection: Position = preset.inHome1.client.borderBox.center;

export const liftArgs: LiftArgs = {
  id: critical.draggable.id,
  clientSelection,
  movementMode: 'FLUID',
};

export const initialPublishArgs: InitialPublishArgs = {
  critical,
  dimensions: preset.dimensions,
  clientSelection,
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

const result: DropResult = {
  ...getDragStart(critical),
  destination: getHomeLocation(critical.draggable),
  reason: 'DROP',
  combine: null,
};

export const completed: CompletedDrag = {
  critical,
  result,
  impact: homeImpact,
};

export const animateDropArgs: AnimateDropArgs = {
  completed,
  dropDuration: 1,
  newHomeClientOffset: { x: 10, y: 10 },
};

export const userCancelArgs: PendingDrop = {
  ...animateDropArgs,
  completed: {
    ...completed,
    result: {
      ...completed.result,
      reason: 'CANCEL',
    },
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
