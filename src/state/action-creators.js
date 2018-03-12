// @flow
import type {
  DraggableId,
  DroppableId,
  DropResult,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  InitialDragPositions,
  DraggableLocation,
  Position,
  Dispatch,
  State,
  CurrentDrag,
  InitialDrag,
  DraggableDescriptor,
  LiftRequest,
  AutoScrollMode,
  ScrollOptions,
  Viewport,
} from '../types';
import noImpact from './no-impact';
import withDroppableDisplacement from './with-droppable-displacement';
import getNewHomeClientCenter from './get-new-home-client-center';
import { add, subtract, isEqual } from './position';
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

export type RequestDimensionsAction = {|
  type: 'REQUEST_DIMENSIONS',
  payload: LiftRequest,
|}

export const requestDimensions = (request: LiftRequest): RequestDimensionsAction => ({
  type: 'REQUEST_DIMENSIONS',
  payload: request,
});

export type CompleteLiftAction = {|
  type: 'COMPLETE_LIFT',
  payload: {|
    id: DraggableId,
    client: InitialDragPositions,
    viewport: Viewport,
    autoScrollMode: AutoScrollMode,
  |}
|}

export const completeLift = (
  id: DraggableId,
  client: InitialDragPositions,
  viewport: Viewport,
  autoScrollMode: AutoScrollMode,
): CompleteLiftAction => ({
  type: 'COMPLETE_LIFT',
  payload: {
    id,
    client,
    viewport,
    autoScrollMode,
  },
});

export type PublishDraggableDimensionAction = {|
  type: 'PUBLISH_DRAGGABLE_DIMENSION',
  payload: DraggableDimension,
|}

export const publishDraggableDimension =
  (dimension: DraggableDimension): PublishDraggableDimensionAction => ({
    type: 'PUBLISH_DRAGGABLE_DIMENSION',
    payload: dimension,
  });

export type PublishDroppableDimensionAction = {|
  type: 'PUBLISH_DROPPABLE_DIMENSION',
  payload: DroppableDimension,
|}

export const publishDroppableDimension =
  (dimension: DroppableDimension): PublishDroppableDimensionAction => ({
    type: 'PUBLISH_DROPPABLE_DIMENSION',
    payload: dimension,
  });

export type BulkPublishDimensionsAction = {|
  type: 'BULK_DIMENSION_PUBLISH',
  payload: {|
    droppables: DroppableDimension[],
    draggables: DraggableDimension[],
  |}
|}

export const bulkPublishDimensions = (
  droppables: DroppableDimension[],
  draggables: DraggableDimension[],
): BulkPublishDimensionsAction => ({
  type: 'BULK_DIMENSION_PUBLISH',
  payload: {
    droppables,
    draggables,
  },
});

export type UpdateDroppableDimensionScrollAction = {|
  type: 'UPDATE_DROPPABLE_DIMENSION_SCROLL',
  payload: {
    id: DroppableId,
    offset: Position,
  }
|}

export const updateDroppableDimensionScroll =
  (id: DroppableId, offset: Position): UpdateDroppableDimensionScrollAction => ({
    type: 'UPDATE_DROPPABLE_DIMENSION_SCROLL',
    payload: {
      id,
      offset,
    },
  });

export type UpdateDroppableDimensionIsEnabledAction = {|
  type: 'UPDATE_DROPPABLE_DIMENSION_IS_ENABLED',
  payload: {
    id: DroppableId,
    isEnabled: boolean,
  }
|}

export const updateDroppableDimensionIsEnabled =
  (id: DroppableId, isEnabled: boolean): UpdateDroppableDimensionIsEnabledAction => ({
    type: 'UPDATE_DROPPABLE_DIMENSION_IS_ENABLED',
    payload: {
      id,
      isEnabled,
    },
  });

export type MoveAction = {|
  type: 'MOVE',
  payload: {|
    id: DraggableId,
    client: Position,
    viewport: Viewport,
    shouldAnimate: boolean,
  |}
|}

export const move = (
  id: DraggableId,
  client: Position,
  viewport: Viewport,
  shouldAnimate?: boolean = false,
): MoveAction => ({
  type: 'MOVE',
  payload: {
    id,
    client,
    viewport,
    shouldAnimate,
  },
});

export type MoveByWindowScrollAction = {|
  type: 'MOVE_BY_WINDOW_SCROLL',
  payload: {|
    id: DraggableId,
    viewport: Viewport,
  |}
|}

export const moveByWindowScroll =
  (id: DraggableId, viewport: Viewport): MoveByWindowScrollAction => ({
    type: 'MOVE_BY_WINDOW_SCROLL',
    payload: {
      id,
      viewport,
    },
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

    // dropped before a drag officially started - this is fine
    if (state.phase === 'PREPARING' || state.phase === 'COLLECTING_INITIAL_DIMENSIONS') {
      dispatch(clean());
      return;
    }

    // dropped in another phase except for dragging - this is an error
    if (state.phase !== 'DRAGGING') {
      console.error(`not able to drop in phase: '${state.phase}'`);
      dispatch(clean());
      return;
    }

    if (!state.drag) {
      console.error('not able to drop when there is invalid drag state', state);
      dispatch(clean());
      return;
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

    const newCenter: Position = getNewHomeClientCenter({
      movement: impact.movement,
      draggable,
      draggables: state.dimension.draggable,
      destination,
    });

    const clientOffset: Position = subtract(newCenter, draggable.client.marginBox.center);
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
      return;
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

export type LiftAction = {|
  type: 'LIFT',
  payload: {|
    id: DraggableId,
    client: InitialDragPositions,
    viewport: Viewport,
    autoScrollMode: AutoScrollMode,
  |}
|}

// lifting with DraggableId rather than descriptor
// as the descriptor might change after a drop is flushed
export const lift = (id: DraggableId,
  client: InitialDragPositions,
  viewport: Viewport,
  autoScrollMode: AutoScrollMode,
) => (dispatch: Dispatch, getState: Function) => {
  // Phase 1: Quickly finish any current drop animations
  const initial: State = getState();

  // flush dropping animation if needed
  // this can change the descriptor of the dragging item
  if (initial.phase === 'DROP_ANIMATING') {
    if (!initial.drop || !initial.drop.pending) {
      console.error('cannot flush drop animation if there is no pending');
      dispatch(clean());
    } else {
      // this can cause descriptor updates in the dimension marshal
      dispatch(completeDrop(initial.drop.pending.result));
    }
  }

  // https://github.com/chenglou/react-motion/issues/437
  // need to allow a flush of react-motion
  dispatch(prepare());

  setTimeout(() => {
    // Phase 2: collect initial dimensions
    const state: State = getState();

    // drag cancelled before timeout finished
    if (state.phase !== 'PREPARING') {
      return;
    }

    // will communicate with the marshal to start requesting dimensions
    const scrollOptions: ScrollOptions = {
      shouldPublishImmediately: autoScrollMode === 'JUMP',
    };
    const request: LiftRequest = {
      draggableId: id,
      scrollOptions,
    };
    dispatch(requestDimensions(request));

    // Need to allow an opportunity for the dimensions to be requested.
    setTimeout(() => {
      // Phase 3: dimensions are collected: start a lift
      const newState: State = getState();

      // drag was already cancelled before dimensions all collected
      if (newState.phase !== 'COLLECTING_INITIAL_DIMENSIONS') {
        return;
      }

      dispatch(completeLift(id, client, viewport, autoScrollMode));
      timings.finish('LIFT');
    });
  });
};

export type Action =
  CompleteLiftAction |
  RequestDimensionsAction |
  PublishDraggableDimensionAction |
  PublishDroppableDimensionAction |
  BulkPublishDimensionsAction |
  UpdateDroppableDimensionScrollAction |
  UpdateDroppableDimensionIsEnabledAction |
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
