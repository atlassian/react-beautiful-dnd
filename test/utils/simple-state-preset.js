// @flow
import { getPreset } from './dimension';
import noImpact from '../../src/state/no-impact';
import type {
  State,
  DraggableDescriptor,
  DroppableDescriptor,
  DimensionState,
  DraggableDimension,
  DroppableDimension,
  CurrentDragPositions,
  InitialDragPositions,
  Position,
  DragState,
  DropResult,
  PendingDrop,
  DropTrigger,
  DraggableId,
} from '../../src/types';

const preset = getPreset();

const getDimensionState = (request: DraggableId): DimensionState => {
  const draggable: DraggableDimension = preset.draggables[request];
  const home: DroppableDimension = preset.droppables[draggable.descriptor.droppableId];

  const result: DimensionState = {
    request,
    draggable: { [draggable.descriptor.id]: draggable },
    droppable: { [home.descriptor.id]: home },
  };
  return result;
};

export const idle: State = {
  phase: 'IDLE',
  drag: null,
  drop: null,
  dimension: {
    request: null,
    draggable: {},
    droppable: {},
  },
};

export const preparing: State = {
  ...idle,
  phase: 'PREPARING',
};

export const requesting = (request?: DraggableId = preset.inHome1.descriptor.id): State => {
  const result: State = {
    phase: 'COLLECTING_INITIAL_DIMENSIONS',
    drag: null,
    drop: null,
    dimension: {
      request,
      draggable: {},
      droppable: {},
    },
  };
  return result;
};

const origin: Position = { x: 0, y: 0 };

export const dragging = (
  id?: DraggableId = preset.inHome1.descriptor.id,
  selection?: Position,
): State => {
  // will populate the dimension state with the initial dimensions
  const draggable: DraggableDimension = preset.draggables[id];
  // either use the provided selection or use the draggable's center
  const clientSelection: Position = selection || draggable.client.withMargin.center;
  const initialPosition: InitialDragPositions = {
    selection: clientSelection,
    center: clientSelection,
  };
  const clientPositions: CurrentDragPositions = {
    selection: clientSelection,
    center: clientSelection,
    offset: origin,
  };

  const drag: DragState = {
    initial: {
      descriptor: draggable.descriptor,
      autoScrollMode: 'FLUID',
      client: initialPosition,
      page: initialPosition,
      windowScroll: origin,
    },
    current: {
      client: clientPositions,
      page: clientPositions,
      windowScroll: origin,
      shouldAnimate: false,
    },
    impact: noImpact,
    scrollJumpRequest: null,
  };

  const result: State = {
    phase: 'DRAGGING',
    drag,
    drop: null,
    dimension: getDimensionState(id),
  };

  return result;
};

const getDropAnimating = (id: DraggableId, trigger: DropTrigger): State => {
  const descriptor: DraggableDescriptor = preset.draggables[id].descriptor;
  const home: DroppableDescriptor = preset.droppables[descriptor.droppableId].descriptor;
  const pending: PendingDrop = {
    trigger,
    newHomeOffset: origin,
    impact: noImpact,
    result: {
      draggableId: descriptor.id,
      type: home.type,
      source: {
        droppableId: home.id,
        index: descriptor.index,
      },
      destination: null,
    },
  };

  const result: State = {
    phase: 'DROP_ANIMATING',
    drag: null,
    drop: {
      pending,
      result: null,
    },
    dimension: getDimensionState(descriptor.id),
  };
  return result;
};

export const dropAnimating = (
  id?: DraggableId = preset.inHome1.descriptor.id
): State => getDropAnimating(id, 'DROP');

export const userCancel = (
  id?: DraggableId = preset.inHome1.descriptor.id
): State => getDropAnimating(id, 'CANCEL');

export const dropComplete = (
  id?: DraggableId = preset.inHome1.descriptor.id
): State => {
  const descriptor: DraggableDescriptor = preset.draggables[id].descriptor;
  const home: DroppableDescriptor = preset.droppables[descriptor.droppableId].descriptor;
  const result: DropResult = {
    draggableId: descriptor.id,
    type: home.type,
    source: {
      droppableId: home.id,
      index: descriptor.index,
    },
    destination: null,
  };

  const value: State = {
    phase: 'DROP_COMPLETE',
    drag: null,
    drop: {
      pending: null,
      result,
    },
    dimension: {
      request: null,
      draggable: {},
      droppable: {},
    },
  };
  return value;
};

export const allPhases = (id? : DraggableId = preset.inHome1.descriptor.id): State[] => [
  idle,
  preparing,
  requesting(id),
  dragging(id),
  dropAnimating(id),
  userCancel(id),
  dropComplete(id),
];

