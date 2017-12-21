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
  DropTrigger,
  CurrentDrag,
  InitialDrag,
  DraggableDescriptor,
} from '../types';
import noImpact from './no-impact';
import getNewHomeClientCenter from './get-new-home-client-center';
import { add, subtract, isEqual } from './position';

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
    initial.windowScroll,
    current.windowScroll
  );

  // TODO: correct?
  const droppableScrollDiff: Position = droppable ?
    droppable.viewport.frameScroll.diff.displacement :
    origin;

  return add(windowScrollDiff, droppableScrollDiff);
};

export type RequestDimensionsAction = {|
  type: 'REQUEST_DIMENSIONS',
  payload: DraggableId,
|}

export const requestDimensions = (id: DraggableId): RequestDimensionsAction => ({
  type: 'REQUEST_DIMENSIONS',
  payload: id,
});

export type CompleteLiftAction = {|
  type: 'COMPLETE_LIFT',
  payload: {|
    id: DraggableId,
    client: InitialDragPositions,
    windowScroll: Position,
    isScrollAllowed: boolean,
  |}
|}

export const completeLift = (
  id: DraggableId,
  client: InitialDragPositions,
  windowScroll: Position,
  isScrollAllowed: boolean,
): CompleteLiftAction => ({
  type: 'COMPLETE_LIFT',
  payload: {
    id,
    client,
    windowScroll,
    isScrollAllowed,
  },
});

export type PublishDraggableDimensionsAction = {|
  type: 'PUBLISH_DRAGGABLE_DIMENSIONS',
  payload: DraggableDimension[]
|}

export const publishDraggableDimensions =
  (dimensions: DraggableDimension[]): PublishDraggableDimensionsAction => ({
    type: 'PUBLISH_DRAGGABLE_DIMENSIONS',
    payload: dimensions,
  });

export type PublishDroppableDimensionsAction = {|
  type: 'PUBLISH_DROPPABLE_DIMENSIONS',
  payload: DroppableDimension[]
|}

export const publishDroppableDimensions =
  (dimensions: DroppableDimension[]): PublishDroppableDimensionsAction => ({
    type: 'PUBLISH_DROPPABLE_DIMENSIONS',
    payload: dimensions,
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
    windowScroll: Position,
  |}
|}

export const move = (id: DraggableId,
  client: Position,
  windowScroll: Position): MoveAction => ({
  type: 'MOVE',
  payload: {
    id,
    client,
    windowScroll,
  },
});

export type MoveByWindowScrollAction = {|
  type: 'MOVE_BY_WINDOW_SCROLL',
  payload: {|
    id: DraggableId,
    windowScroll: Position,
  |}
|}

export const moveByWindowScroll =
  (id: DraggableId, windowScroll: Position): MoveByWindowScrollAction => ({
    type: 'MOVE_BY_WINDOW_SCROLL',
    payload: {
      id,
      windowScroll,
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
    trigger: DropTrigger,
    newHomeOffset: Position,
    impact: DragImpact,
    result: DropResult,
  |}
}

type AnimateDropArgs = {|
  trigger: DropTrigger,
  newHomeOffset: Position,
  impact: DragImpact,
  result: DropResult
|}

const animateDrop = ({
  trigger,
  newHomeOffset,
  impact,
  result,
}: AnimateDropArgs): DropAnimateAction => ({
  type: 'DROP_ANIMATE',
  payload: {
    trigger,
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
    };

    const newCenter: Position = getNewHomeClientCenter({
      movement: impact.movement,
      draggable,
      draggables: state.dimension.draggable,
      destination,
    });

    const clientOffset: Position = subtract(newCenter, draggable.client.withMargin.center);
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
      trigger: 'DROP',
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
    };

    const isAnimationRequired = !isEqual(current.client.offset, origin);

    if (!isAnimationRequired) {
      dispatch(completeDrop(result));
      return;
    }

    const scrollDiff: Position = getScrollDiff({ initial, current, droppable: home });

    dispatch(animateDrop({
      trigger: 'CANCEL',
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
    windowScroll: Position,
    isScrollAllowed: boolean,
  |}
|}

// lifting with DraggableId rather than descriptor
// as the descriptor might change after a drop is flushed
export const lift = (id: DraggableId,
  client: InitialDragPositions,
  windowScroll: Position,
  isScrollAllowed: boolean,
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
    console.time('lifting');
    dispatch(requestDimensions(id));

    // Need to allow an opportunity for the dimensions to be requested.
    setTimeout(() => {
      // Phase 3: dimensions are collected: start a lift
      const newState: State = getState();

      // drag was already cancelled before dimensions all collected
      if (newState.phase !== 'COLLECTING_INITIAL_DIMENSIONS') {
        return;
      }

      dispatch(completeLift(id, client, windowScroll, isScrollAllowed));
      console.timeEnd('lifting');
    });
  });
};

export type Action =
  CompleteLiftAction |
  RequestDimensionsAction |
  PublishDraggableDimensionsAction |
  PublishDroppableDimensionsAction |
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
