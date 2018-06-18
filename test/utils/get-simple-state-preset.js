// @flow
import { type Position } from 'css-box-model';
import { getPreset } from './dimension';
import noImpact from '../../src/state/no-impact';
import { vertical } from '../../src/state/axis';
import getViewport from '../../src/view/window/get-viewport';
import { add } from '../../src/state/position';
import getHomeImpact from '../../src/state/get-home-impact';
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
  Critical,
  CollectingState,
  ScrollOptions,
  Viewport,
  ItemPositions,
  DragPositions,
  DraggingState,
  DropPendingState,
} from '../../src/types';

const scheduled: ScrollOptions = {
  shouldPublishImmediately: false,
};

export default (axis?: Axis = vertical) => {
  const preset = getPreset(axis);
  const critical: Critical = {
    draggable: preset.inHome1.descriptor,
    droppable: preset.home.descriptor,
  };

  const idle: IdleState = {
    phase: 'IDLE',
  };

  const preparing: PreparingState = {
    phase: 'PREPARING',
  };

  const origin: Position = { x: 0, y: 0 };

  const dragging = (
    id?: DraggableId = critical.draggable.id,
    selection?: Position,
    viewport?: Viewport = preset.viewport,
  ): DraggingState => {
    // will populate the dimension state with the initial dimensions
    const draggable: DraggableDimension = preset.draggables[id];
    const droppable: DroppableDimension = preset.droppables[draggable.descriptor.droppableId];
    const clientSelection: Position = selection || draggable.client.borderBox.center;
    const ourCritical: Critical = {
      draggable: draggable.descriptor,
      droppable: droppable.descriptor,
    };

    const client: ItemPositions = {
      selection: clientSelection,
      borderBoxCenter: clientSelection,
      offset: origin,
    };

    const page: ItemPositions = {
      selection: add(client.selection, viewport.scroll.initial),
      borderBoxCenter: add(client.borderBoxCenter, viewport.scroll.initial),
      offset: origin,
    };

    const initial: DragPositions = {
      client, page,
    };

    const result: DraggingState = {
      phase: 'DRAGGING',
      critical: ourCritical,
      isDragging: true,
      autoScrollMode: 'FLUID',
      dimensions: preset.dimensions,
      initial,
      current: initial,
      impact: getHomeImpact(ourCritical, preset.dimensions),
      viewport,
      scrollJumpRequest: null,
      shouldAnimate: false,
    };

    return result;
  };

  const collecting = (): CollectingState => ({
    phase: 'COLLECTING',
    ...dragging(),
    // eslint-disable-next-line
    phase: 'COLLECTING',
  });

  type DropPendingArgs = {
    reason: DropReason,
    isWaiting: boolean,
  };

  const defaultDropPending: DropPendingArgs = {
    reason: 'DROP',
    isWaiting: true,
  };

  const dropPending = (args: ?DropPendingArgs = defaultDropPending): DropPendingState => ({
    phase: 'DROP_PENDING',
    ...dragging(),
    // eslint-disable-next-line
    phase: 'DROP_PENDING',
    ...args,
  });

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
    critical,
    idle,
    preparing,
    dragging,
    scrollJumpRequest,
    dropPending,
    dropAnimating,
    userCancel,
    dropComplete,
    allPhases,
    collecting,
  };
};

