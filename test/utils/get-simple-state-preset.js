// @flow
import { getPreset } from './dimension';
import noImpact from '../../src/state/no-impact';
import { vertical } from '../../src/state/axis';
import type {
  Axis,
  State,
  DraggableDescriptor,
  DroppableDescriptor,
  DimensionState,
  DraggableDimension,
  DroppableDimension,
  CurrentDragPositions,
  InitialDragPositions,
  LiftRequest,
  Position,
  DragState,
  DropResult,
  PendingDrop,
  DropReason,
  DraggableId,
  DragImpact,
  ScrollOptions,
} from '../../src/types';

const scheduled: ScrollOptions = {
  shouldPublishImmediately: false,
};

export default (axis?: Axis = vertical) => {
  const preset = getPreset(axis);

  const getDimensionState = (request: LiftRequest): DimensionState => {
    const draggable: DraggableDimension = preset.draggables[request.draggableId];
    const home: DroppableDimension = preset.droppables[draggable.descriptor.droppableId];

    const result: DimensionState = {
      request,
      draggable: { [draggable.descriptor.id]: draggable },
      droppable: { [home.descriptor.id]: home },
    };
    return result;
  };

  const idle: State = {
    phase: 'IDLE',
    drag: null,
    drop: null,
    dimension: {
      request: null,
      draggable: {},
      droppable: {},
    },
  };

  const preparing: State = {
    ...idle,
    phase: 'PREPARING',
  };

  const defaultLiftRequest: LiftRequest = {
    draggableId: preset.inHome1.descriptor.id,
    scrollOptions: {
      shouldPublishImmediately: false,
    },
  };
  const requesting = (request?: LiftRequest = defaultLiftRequest): State => {
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

  const dragging = (
    id?: DraggableId = preset.inHome1.descriptor.id,
    selection?: Position,
  ): State => {
    // will populate the dimension state with the initial dimensions
    const draggable: DraggableDimension = preset.draggables[id];
    // either use the provided selection or use the draggable's center
    const clientSelection: Position = selection || draggable.client.marginBox.center;
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
        hasCompletedFirstBulkPublish: true,
      },
      impact: noImpact,
      scrollJumpRequest: null,
    };

    const result: State = {
      phase: 'DRAGGING',
      drag,
      drop: null,
      dimension: getDimensionState({
        draggableId: id,
        scrollOptions: scheduled,
      }),
    };

    return result;
  };

  const scrollJumpRequest = (request: Position): State => {
    const id: DraggableId = preset.inHome1.descriptor.id;
    // will populate the dimension state with the initial dimensions
    const draggable: DraggableDimension = preset.draggables[id];
    // either use the provided selection or use the draggable's center
    const initialPosition: InitialDragPositions = {
      selection: draggable.client.marginBox.center,
      center: draggable.client.marginBox.center,
    };
    const clientPositions: CurrentDragPositions = {
      selection: draggable.client.marginBox.center,
      center: draggable.client.marginBox.center,
      offset: origin,
    };

    const impact: DragImpact = {
      movement: {
        displaced: [],
        amount: origin,
        isBeyondStartPosition: false,
      },
      direction: preset.home.axis.direction,
      destination: {
        index: preset.inHome1.descriptor.index,
        droppableId: preset.inHome1.descriptor.droppableId,
      },
    };

    const drag: DragState = {
      initial: {
        descriptor: draggable.descriptor,
        autoScrollMode: 'JUMP',
        client: initialPosition,
        page: initialPosition,
        windowScroll: origin,
      },
      current: {
        client: clientPositions,
        page: clientPositions,
        windowScroll: origin,
        shouldAnimate: true,
        hasCompletedFirstBulkPublish: true,
      },
      impact,
      scrollJumpRequest: request,
    };

    const result: State = {
      phase: 'DRAGGING',
      drag,
      drop: null,
      dimension: getDimensionState({
        draggableId: id,
        scrollOptions: scheduled,
      }),
    };

    return result;
  };

  const getDropAnimating = (id: DraggableId, reason: DropReason): State => {
    const descriptor: DraggableDescriptor = preset.draggables[id].descriptor;
    const home: DroppableDescriptor = preset.droppables[descriptor.droppableId].descriptor;
    const pending: PendingDrop = {
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
        reason,
      },
    };

    const result: State = {
      phase: 'DROP_ANIMATING',
      drag: null,
      drop: {
        pending,
        result: null,
      },
      dimension: getDimensionState({
        draggableId: descriptor.id,
        scrollOptions: scheduled,
      }),
    };
    return result;
  };

  const dropAnimating = (
    id?: DraggableId = preset.inHome1.descriptor.id
  ): State => getDropAnimating(id, 'DROP');

  const userCancel = (
    id?: DraggableId = preset.inHome1.descriptor.id
  ): State => getDropAnimating(id, 'CANCEL');

  const dropComplete = (
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
      reason: 'DROP',
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

  const allPhases = (id? : DraggableId = preset.inHome1.descriptor.id): State[] => [
    idle,
    preparing,
    requesting({
      draggableId: id,
      scrollOptions: scheduled,
    }),
    dragging(id),
    dropAnimating(id),
    userCancel(id),
    dropComplete(id),
  ];

  return {
    idle,
    preparing,
    requesting,
    dragging,
    scrollJumpRequest,
    dropAnimating,
    userCancel,
    dropComplete,
    allPhases,
  };
};

