// @flow
import { type Position } from 'css-box-model';
import { getPreset } from './dimension';
import noImpact from '../../src/state/no-impact';
import { vertical } from '../../src/state/axis';
import getViewport from '../../src/view/window/get-viewport';
import type {
  Axis,
  State,
  IdleState,
  PreparingState,
  DraggableDescriptor,
  DroppableDescriptor,
  DraggableDimension,
  DroppableDimension,
  DropResult,
  PendingDrop,
  DropReason,
  DraggableId,
  DragImpact,
  ScrollOptions,
  Viewport,
  ItemPositions,
  DragPositions,
  DraggingState,
  WindowDetails,
} from '../../src/types';

const scheduled: ScrollOptions = {
  shouldPublishImmediately: false,
};

export default (axis?: Axis = vertical) => {
  const preset = getPreset(axis);

  const idle: IdleState = {
    phase: 'IDLE',
  };

  const preparing: PreparingState = {
    phase: 'PREPARING',
  };

  const origin: Position = { x: 0, y: 0 };

  const dragging = (
    id?: DraggableId = preset.inHome1.descriptor.id,
    selection?: Position,
    viewport?: Viewport = getViewport(),
  ): DraggingState => {
    // will populate the dimension state with the initial dimensions
    const draggable: DraggableDimension = preset.draggables[id];
    const droppable: DroppableDimension = preset.droppables[draggable.descriptor.droppableId];

    const clientSelection: Position = selection || draggable.client.borderBox.center;

    const client: ItemPositions = {
      selection: clientSelection,
      borderBoxCenter: clientSelection,
      offset: origin,
    };

    const initial: DragPositions = {
      client, page: client,
    };

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

    const result: DraggingState = {
      phase: 'DRAGGING',
      critical: {
        draggable: draggable.descriptor,
        droppable: droppable.descriptor,
      },
      autoScrollMode: 'FLUID',
      dimensions: preset.dimensions,
      initial,
      current: initial,
      impact: noImpact,
      window: windowDetails,
      scrollJumpRequest: null,
      shouldAnimate: false,
    };

    return result;
  };

  const scrollJumpRequest = (request: Position, viewport?: Viewport = getViewport()): State => {
    const id: DraggableId = preset.inHome1.descriptor.id;
    // will populate the dimension state with the initial dimensions
    const draggable: DraggableDimension = preset.draggables[id];
    // either use the provided selection or use the draggable's center
    const initialPosition: InitialDragPositions = {
      selection: draggable.client.borderBox.center,
      borderBoxCenter: draggable.client.borderBox.center,
    };
    const clientPositions: CurrentDragPositions = {
      selection: draggable.client.marginBox.center,
      borderBoxCenter: draggable.client.borderBox.center,
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
        viewport,
      },
      current: {
        client: clientPositions,
        page: clientPositions,
        shouldAnimate: true,
        hasCompletedFirstBulkPublish: true,
        viewport,
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
    dragging,
    scrollJumpRequest,
    dropAnimating,
    userCancel,
    dropComplete,
    allPhases,
  };
};

