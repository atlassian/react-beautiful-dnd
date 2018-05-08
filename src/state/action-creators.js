// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import type {
  Critical,
  DraggableId,
  DroppableId,
  DropResult,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  ItemPositions,
  DraggableLocation,
  Dispatch,
  State,
  DraggableDescriptor,
  LiftRequest,
  AutoScrollMode,
  ScrollOptions,
  Viewport,
  DimensionMap,
} from '../types';
import noImpact from './no-impact';
import withDroppableDisplacement from './with-droppable-displacement';
import getNewHomeClientBorderBoxCenter from './get-new-home-client-border-box-center';
import { add, subtract, isEqual } from './position';
import { type DimensionMarshal } from './dimension-marshal/dimension-marshal-types';
import * as timings from '../debug/timings';

const origin: Position = { x: 0, y: 0 };

type ScrollDiffArgs = {|
  initial: InitialDrag,
  current: CurrentDrag,
  droppable: ?DroppableDimension
|}

const getScrollDiff = ({
  initial,
  current,
  droppable,
}: ScrollDiffArgs): Position => {
  const windowScrollDiff: Position = subtract(
    initial.viewport.scroll,
    current.viewport.scroll,
  );

  if (!droppable) {
    return windowScrollDiff;
  }

  return withDroppableDisplacement(droppable, windowScrollDiff);
};

type LiftArgs = {|
  // lifting with DraggableId rather than descriptor
  // as the descriptor might change after a drop is flushed
  id: DraggableId,
  client: ItemPositions,
  viewport: Viewport,
  autoScrollMode: AutoScrollMode,
|}

export type LiftAction = {|
  type: 'LIFT',
  payload: LiftArgs
|}

export const lift = (args: LiftArgs): LiftAction => ({
  type: 'LIFT',
  payload: args,
});

type InitialPublishArgs = {|
  critical: Critical,
  dimensions: DimensionMap,
  client: ItemPositions,
  viewport: Viewport,
  autoScrollMode: AutoScrollMode,
|}

export type InitialPublishAction = {|
  type: 'INITIAL_PUBLISH',
  payload: InitialPublishArgs
|}

export const initialPublish = (args: InitialPublishArgs): InitialPublishAction => ({
  type: 'INITIAL_PUBLISH',
  payload: args,
});

export type BulkReplaceArgs = {|
  dimensions: DimensionMap,
  viewport: Viewport,
  shouldReplaceCritical: boolean,
|}

export type BulkReplaceAction = {|
  type: 'BULK_REPLACE',
  payload: BulkReplaceArgs
|}

export const bulkReplace = (args: BulkReplaceArgs): BulkReplaceAction => ({
  type: 'BULK_REPLACE',
  payload: args,
});

type UpdateDroppableScrollArgs = {
  id: DroppableId,
  offset: Position,
}

export type UpdateDroppableScrollAction = {|
  type: 'UPDATE_DROPPABLE_SCROLL',
  payload: UpdateDroppableScrollArgs
|}

export const updateDroppableScroll =
  (args: UpdateDroppableScrollArgs): UpdateDroppableScrollAction => ({
    type: 'UPDATE_DROPPABLE_SCROLL',
    payload: args,
  });

type UpdateDroppableIsEnabledArgs = {|
  id: DroppableId,
  isEnabled: boolean,
|};

export type UpdateDroppableIsEnabledAction = {|
  type: 'UPDATE_DROPPABLE_IS_ENABLED',
  payload: UpdateDroppableIsEnabledArgs
|}

export const updateDroppableIsEnabled =
  (args: UpdateDroppableIsEnabledArgs): UpdateDroppableIsEnabledAction => ({
    type: 'UPDATE_DROPPABLE_IS_ENABLED',
    payload: args,
  });

type MoveArgs = {|
  client: Position,
  shouldAnimate: boolean,
|}

export type MoveAction = {|
  type: 'MOVE',
  payload: MoveArgs
|}

export const move = (args: MoveArgs): MoveAction => ({
  type: 'MOVE',
  payload: args,
});

type MoveByWindowScrollArgs = {|
  viewport: Viewport,
|}

export type MoveByWindowScrollAction = {|
  type: 'MOVE_BY_WINDOW_SCROLL',
  payload: MoveByWindowScrollArgs
|}

export const moveByWindowScroll = (args: MoveByWindowScrollArgs): MoveByWindowScrollAction => ({
  type: 'MOVE_BY_WINDOW_SCROLL',
  payload: args,
});

export type MoveBackwardAction = {|
  type: 'MOVE_BACKWARD',
  payload: DraggableId
|}

export const moveBackward = (id: DraggableId): MoveBackwardAction => ({
  type: 'MOVE_BACKWARD',
  payload: id,
});

export type MoveForwardAction = {|
  type: 'MOVE_FORWARD',
  payload: DraggableId
|}

export const moveForward = (id: DraggableId): MoveForwardAction => ({
  type: 'MOVE_FORWARD',
  payload: id,
});

export type CrossAxisMoveForwardAction = {|
  type: 'CROSS_AXIS_MOVE_FORWARD',
  payload: DraggableId
|}

export const crossAxisMoveForward = (id: DraggableId): CrossAxisMoveForwardAction => ({
  type: 'CROSS_AXIS_MOVE_FORWARD',
  payload: id,
});

export type CrossAxisMoveBackwardAction = {|
  type: 'CROSS_AXIS_MOVE_BACKWARD',
  payload: DraggableId
|}

export const crossAxisMoveBackward = (id: DraggableId): CrossAxisMoveBackwardAction => ({
  type: 'CROSS_AXIS_MOVE_BACKWARD',
  payload: id,
});

type CleanAction = {
  type: 'CLEAN',
  payload: null,
}

export const clean = (): CleanAction => ({
  type: 'CLEAN',
  payload: null,
});

type PrepareAction = {
  type: 'PREPARE',
  payload: null,
}

export const prepare = (): PrepareAction => ({
  type: 'PREPARE',
  payload: null,
});

export type DropAnimateAction = {
  type: 'DROP_ANIMATE',
  payload: {|
    newHomeOffset: Position,
    impact: DragImpact,
    result: DropResult,
  |}
}

type AnimateDropArgs = {|
  newHomeOffset: Position,
  impact: DragImpact,
  result: DropResult
|}

const animateDrop = ({
  newHomeOffset,
  impact,
  result,
}: AnimateDropArgs): DropAnimateAction => ({
  type: 'DROP_ANIMATE',
  payload: {
    newHomeOffset,
    impact,
    result,
  },
});

export type DropCompleteAction = {
  type: 'DROP_COMPLETE',
  payload: DropResult,
}

export const completeDrop = (result: DropResult): DropCompleteAction => ({
  type: 'DROP_COMPLETE',
  payload: result,
});

export const drop = () =>
  (dispatch: Dispatch, getState: () => State): void => {
    const state: State = getState();

    throw new Error('TODO: move to middleware');

    // Should not really happen, but oh well
    if (state.phase === 'IDLE') {
      dispatch(clean());
    }

    // dropped before a drag officially started - this is fine
    if (state.phase === 'PREPARING') {
      dispatch(clean());
    }

    // We cannot drop - we need to wait for the collection to finish
    if (state.phase === 'BULK_COLLECTING') {
      dispatch(dropAfterCollection());
    }

    // TODO: blash
    if (state.phase === 'DRAGGING') {
      dispatch(startDrop());
    }

    throw new Error(`Cannot drop in phase ${state.phase}`);

    // dropped in another phase except for dragging - this is an error
    if (state.phase !== 'DRAGGING') {
      console.error(`not able to drop in phase: '${state.phase}'`);
      dispatch(clean());
    }

    if (!state.drag) {
      console.error('not able to drop when there is invalid drag state', state);
      dispatch(clean());
    }

    const { impact, initial, current } = state.drag;
    const descriptor: DraggableDescriptor = initial.descriptor;
    const draggable: DraggableDimension = state.dimension.draggable[initial.descriptor.id];
    const home: DroppableDimension = state.dimension.droppable[draggable.descriptor.droppableId];
    const destination: ?DroppableDimension = impact.destination ?
      state.dimension.droppable[impact.destination.droppableId] :
      null;

    const source: DraggableLocation = {
      droppableId: descriptor.droppableId,
      index: descriptor.index,
    };

    const result: DropResult = {
      draggableId: descriptor.id,
      type: home.descriptor.type,
      source,
      destination: impact.destination,
      reason: 'DROP',
    };

    const newBorderBoxCenter: Position = getNewHomeClientBorderBoxCenter({
      movement: impact.movement,
      draggable,
      draggables: state.dimension.draggable,
      destination,
    });

    const clientOffset: Position = subtract(newBorderBoxCenter, draggable.client.borderBox.center);
    const scrollDiff: Position = getScrollDiff({
      initial,
      current,
      droppable: destination || home,
    });
    const newHomeOffset: Position = add(clientOffset, scrollDiff);

    // Do not animate if you do not need to.
    // This will be the case if either you are dragging with a
    // keyboard or if you manage to nail it just with a mouse.
    const isAnimationRequired = !isEqual(
      current.client.offset,
      newHomeOffset,
    );

    if (!isAnimationRequired) {
      dispatch(completeDrop(result));
    }

    dispatch(animateDrop({
      newHomeOffset,
      impact,
      result,
    }));
  };

export const cancel = () =>
  (dispatch: Dispatch, getState: () => State): void => {
    const state: State = getState();

    // only allowing cancelling in the DRAGGING phase
    if (state.phase !== 'DRAGGING') {
      dispatch(clean());
      return;
    }

    if (!state.drag) {
      console.error('invalid drag state', state);
      dispatch(clean());
      return;
    }

    const { initial, current } = state.drag;
    const descriptor = initial.descriptor;
    const home: DroppableDimension = state.dimension.droppable[descriptor.droppableId];

    const source: DraggableLocation = {
      index: descriptor.index,
      droppableId: descriptor.droppableId,
    };

    const result: DropResult = {
      draggableId: descriptor.id,
      type: home.descriptor.type,
      source,
      // no destination when cancelling
      destination: null,
      reason: 'CANCEL',
    };

    const isAnimationRequired = !isEqual(current.client.offset, origin);

    if (!isAnimationRequired) {
      dispatch(completeDrop(result));
      return;
    }

    const scrollDiff: Position = getScrollDiff({ initial, current, droppable: home });

    dispatch(animateDrop({
      newHomeOffset: scrollDiff,
      impact: noImpact,
      result,
    }));
  };

export const dropAnimationFinished = () =>
  (dispatch: Dispatch, getState: () => State): void => {
    const state: State = getState();

    if (state.phase !== 'DROP_ANIMATING') {
      console.error('cannot end drop that is no longer animating', state);
      dispatch(clean());
      return;
    }

    if (!state.drop || !state.drop.pending) {
      console.error('cannot end drop that has no pending state', state);
      dispatch(clean());
      return;
    }

    dispatch(completeDrop(state.drop.pending.result));
  };

export type Action =
  LiftAction |
  InitialPublishAction |
  BulkReplaceAction |
  UpdateDroppableScrollAction |
  UpdateDroppableIsEnabledAction |
  MoveByWindowScrollAction |
  MoveAction |
  MoveBackwardAction |
  MoveForwardAction |
  CrossAxisMoveForwardAction |
  CrossAxisMoveBackwardAction |
  DropAnimateAction |
  DropCompleteAction |
  PrepareAction |
  CleanAction;
