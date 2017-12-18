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
} from '../../src/types';

const preset = getPreset();

const getDimensionState = (request: DraggableDescriptor): DimensionState => {
  const draggable: DraggableDimension = preset.draggables[request.id];
  const home: DroppableDimension = preset.droppables[request.droppableId];

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

export const requesting = (request?: DraggableDescriptor = preset.inHome1.descriptor): State => {
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
  descriptor?: DraggableDescriptor = preset.inHome1.descriptor
): State => {
  // will populate the dimension state with the initial dimensions
  const draggable: DraggableDimension = preset.draggables[descriptor.id];
  const client: Position = draggable.client.withMargin.center;
  const initialPosition: InitialDragPositions = {
    selection: client,
    center: client,
  };
  const clientPositions: CurrentDragPositions = {
    selection: client,
    center: client,
    offset: origin,
  };

  const drag: DragState = {
    initial: {
      descriptor,
      isScrollAllowed: true,
      client: initialPosition,
      page: initialPosition,
      windowScroll: origin,
    },
    current: {
      client: clientPositions,
      page: clientPositions,
      windowScroll: origin,
      shouldAnimate: true,
    },
    impact: noImpact,
  };

  const result: State = {
    phase: 'DRAGGING',
    drag,
    drop: null,
    dimension: getDimensionState(descriptor),
  };

  return result;
};

const getDropAnimating = (descriptor: DraggableDescriptor, trigger: DropTrigger) => {
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
    dimension: getDimensionState(descriptor),
  };
  return result;
};

export const dropAnimating = (
  descriptor?: DraggableDescriptor = preset.inHome1.descriptor
): State => getDropAnimating(descriptor, 'DROP');

export const userCancel = (
  descriptor?: DraggableDescriptor = preset.inHome1.descriptor
): State => getDropAnimating(descriptor, 'CANCEL');

export const dropComplete = (
  descriptor?: DraggableDescriptor = preset.inHome1.descriptor
): State => {
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

