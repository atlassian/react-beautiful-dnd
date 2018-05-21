// @flow
import { type Position } from 'css-box-model';
import { getPreset, getInitialImpact } from './dimension';
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
      impact: getInitialImpact(draggable, droppable.axis),
      window: windowDetails,
      scrollJumpRequest: null,
      shouldAnimate: false,
    };

    return result;
  };

  const scrollJumpRequest = (
    request: Position,
    viewport?: Viewport = getViewport(),
  ): DraggingState => {
    const state: DraggingState = dragging(undefined, undefined, viewport);

    return {
      ...state,
      autoScrollMode: 'JUMP',
      scrollJumpRequest: request,
    };
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

