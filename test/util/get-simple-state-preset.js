// @flow
import { type Position } from 'css-box-model';
import { getPreset } from './dimension';
import { vertical } from '../../src/state/axis';
import getViewport from '../../src/view/window/get-viewport';
import { add } from '../../src/state/position';
import getLiftEffect from '../../src/state/get-lift-effect';
import getHomeLocation from '../../src/state/get-home-location';
import { forward } from '../../src/state/user-direction/user-direction-preset';
import type {
  Axis,
  State,
  IdleState,
  DraggableDimension,
  DroppableDimension,
  DropResult,
  CompletedDrag,
  DropReason,
  DraggableId,
  DropAnimatingState,
  Critical,
  CollectingState,
  Viewport,
  ClientPositions,
  PagePositions,
  DragPositions,
  DraggingState,
  DropPendingState,
} from '../../src/types';

export default (axis?: Axis = vertical) => {
  const preset = getPreset(axis);
  const critical: Critical = {
    draggable: preset.inHome1.descriptor,
    droppable: preset.home.descriptor,
  };

  const idle: IdleState = {
    phase: 'IDLE',
    completed: null,
    shouldFlush: false,
  };

  const origin: Position = { x: 0, y: 0 };

  const dragging = (
    id?: DraggableId = critical.draggable.id,
    selection?: Position,
    viewport?: Viewport = preset.viewport,
  ): DraggingState => {
    // will populate the dimension state with the initial dimensions
    const draggable: DraggableDimension = preset.draggables[id];
    const droppable: DroppableDimension =
      preset.droppables[draggable.descriptor.droppableId];
    const clientSelection: Position =
      selection || draggable.client.borderBox.center;
    const ourCritical: Critical = {
      draggable: draggable.descriptor,
      droppable: droppable.descriptor,
    };

    const client: ClientPositions = {
      selection: clientSelection,
      borderBoxCenter: clientSelection,
      offset: origin,
    };

    const page: PagePositions = {
      selection: add(client.selection, viewport.scroll.initial),
      borderBoxCenter: add(client.borderBoxCenter, viewport.scroll.initial),
    };

    const initial: DragPositions = {
      client,
      page,
    };

    const { impact, afterCritical } = getLiftEffect({
      draggable,
      home: droppable,
      draggables: preset.dimensions.draggables,
      viewport,
    });

    const result: DraggingState = {
      phase: 'DRAGGING',
      critical: ourCritical,
      isDragging: true,
      movementMode: 'FLUID',
      dimensions: preset.dimensions,
      initial,
      current: initial,
      impact,
      afterCritical,
      onLiftImpact: impact,
      userDirection: forward,
      isWindowScrollAllowed: true,
      viewport,
      scrollJumpRequest: null,
      forceShouldAnimate: null,
    };

    return result;
  };

  const collecting = (
    id?: DraggableId,
    selection?: Position,
    viewport?: Viewport,
  ): CollectingState => ({
    phase: 'COLLECTING',
    ...dragging(id, selection, viewport),
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

  const dropPending = (
    args: ?DropPendingArgs = defaultDropPending,
  ): DropPendingState => ({
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
      movementMode: 'SNAP',
      scrollJumpRequest: request,
    };
  };

  const getDropAnimating = (
    id: DraggableId,
    reason: DropReason,
  ): DropAnimatingState => {
    const draggable: DraggableDimension = preset.draggables[id];
    const home: DroppableDimension =
      preset.droppables[draggable.descriptor.droppableId];

    const { impact, afterCritical } = getLiftEffect({
      draggable,
      home,
      draggables: preset.dimensions.draggables,
      viewport: preset.viewport,
    });

    const result: DropResult = {
      draggableId: draggable.descriptor.id,
      type: draggable.descriptor.type,
      source: {
        droppableId: draggable.descriptor.droppableId,
        index: draggable.descriptor.index,
      },
      // no destination when cancelling for result
      destination:
        reason === 'DROP' ? getHomeLocation(draggable.descriptor) : null,
      reason,
      combine: null,
      mode: 'FLUID',
    };

    const ourCritical: Critical = {
      draggable: draggable.descriptor,
      droppable: home.descriptor,
    };

    const completed: CompletedDrag = {
      critical: ourCritical,
      afterCritical,
      impact,
      result,
    };

    const state: DropAnimatingState = {
      phase: 'DROP_ANIMATING',
      completed,
      dimensions: preset.dimensions,
      newHomeClientOffset: { x: 10, y: 20 },
      dropDuration: 1,
    };
    return state;
  };

  const dropAnimating = (
    id?: DraggableId = preset.inHome1.descriptor.id,
  ): DropAnimatingState => getDropAnimating(id, 'DROP');

  const userCancel = (
    id?: DraggableId = preset.inHome1.descriptor.id,
  ): DropAnimatingState => getDropAnimating(id, 'CANCEL');

  const allPhases = (
    id?: DraggableId = preset.inHome1.descriptor.id,
  ): State[] => [idle, dragging(id), dropAnimating(id), userCancel(id)];

  return {
    critical,
    idle,
    dragging,
    scrollJumpRequest,
    dropPending,
    dropAnimating,
    userCancel,
    allPhases,
    collecting,
    preset,
  };
};
