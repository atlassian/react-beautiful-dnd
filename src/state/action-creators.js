// @flow
import type {
  DraggableId,
  DroppableId,
  DropResult,
  TypeId,
  DraggableDimension,
  DroppableDimension,
  InitialDragLocation,
  Position,
  Dispatch,
  State,
} from '../types';
import getNewHomeClientOffset from './get-new-home-client-offset';
import { subtract, isEqual } from './position';

export type RequestDimensionsAction = {|
  type: 'REQUEST_DIMENSIONS',
  payload: TypeId
|}

export const requestDimensions = (type: TypeId): RequestDimensionsAction => ({
  type: 'REQUEST_DIMENSIONS',
  payload: type,
});

export type BeginLiftAction = {|
  type: 'BEGIN_LIFT'
|}

const beginLift = (): BeginLiftAction => ({
  type: 'BEGIN_LIFT',
});

export type CompleteLiftAction = {|
  type: 'COMPLETE_LIFT',
  payload: {|
    id: DraggableId,
    type: TypeId,
    client: InitialDragLocation,
    page: InitialDragLocation,
    windowScroll: Position,
  |}
|}

const completeLift = (id: DraggableId,
  type: TypeId,
  client: InitialDragLocation,
  page: InitialDragLocation,
  windowScroll: Position,
): CompleteLiftAction => ({
  type: 'COMPLETE_LIFT',
  payload: {
    id,
    type,
    client,
    page,
    windowScroll,
  },
});

export type PublishDraggableDimensionAction = {|
  type: 'PUBLISH_DRAGGABLE_DIMENSION',
  payload: DraggableDimension
|}

export const publishDraggableDimension =
  (dimension: DraggableDimension): PublishDraggableDimensionAction => ({
    type: 'PUBLISH_DRAGGABLE_DIMENSION',
    payload: dimension,
  });

export type PublishDroppableDimensionAction = {|
  type: 'PUBLISH_DROPPABLE_DIMENSION',
  payload: DroppableDimension
|}

export const publishDroppableDimension =
  (dimension: DroppableDimension): PublishDroppableDimensionAction => ({
    type: 'PUBLISH_DROPPABLE_DIMENSION',
    payload: dimension,
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

export type MoveAction = {|
  type: 'MOVE',
  payload: {|
    id: DraggableId,
    client: Position,
    page: Position,
    windowScroll: Position,
  |}
|}

export const move = (id: DraggableId,
  client: Position,
  page: Position,
  windowScroll: Position): MoveAction => ({
    type: 'MOVE',
    payload: {
      id,
      client,
      page,
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

export type CancelAction = {
  type: 'CANCEL',
  payload: DraggableId
}

export const cancel = (id: DraggableId): CancelAction => ({
  type: 'CANCEL',
  payload: id,
});

export type DropAnimateAction = {
  type: 'DROP_ANIMATE',
  payload: {|
    newHomeOffset: Position,
    result: DropResult,
  |}
}

const animateDrop = (newHomeOffset: Position, result: DropResult): DropAnimateAction => ({
  type: 'DROP_ANIMATE',
  payload: {
    newHomeOffset,
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

export const drop = (id: DraggableId) =>
  (dispatch: Dispatch, getState: () => State): void => {
    const state: State = getState();

    // This can occur if the user ends a drag before
    // the collecting phase is finished.
    // This will not trigger a hook as the hook waits
    // for a DRAGGING phase before firing a onDragStart
    if (state.phase === 'COLLECTING_DIMENSIONS') {
      console.error('canceling drag while collecting');
      dispatch(cancel(id));
      return;
    }

    if (state.phase !== 'DRAGGING') {
      console.error('cannot drop if not dragging', state);
      dispatch(cancel(id));
      return;
    }

    if (!state.drag) {
      console.error('invalid drag state', state);
      dispatch(cancel(id));
      return;
    }

    const { impact, initial, current } = state.drag;
    const droppable: DroppableDimension = state.dimension.droppable[initial.source.droppableId];

    const result: DropResult = {
      draggableId: current.id,
      source: initial.source,
      destination: impact.destination,
    };

    const scrollDiff: Position = subtract(droppable.scroll.initial, droppable.scroll.current);

    const newHomeOffset: Position = getNewHomeClientOffset({
      movement: impact.movement,
      clientOffset: current.client.offset,
      pageOffset: current.page.offset,
      scrollDiff,
      draggables: state.dimension.draggable,
    });

    // Do not animate if you do not need to.
    // This will be the case if either you are dragging with a
    // keyboard or if you manage to nail it just with a mouse.
    const isAnimationRequired = !isEqual(
      current.client.offset,
      newHomeOffset,
    );

    if (isAnimationRequired) {
      dispatch(animateDrop(newHomeOffset, result));
      return;
    }
    dispatch(completeDrop(result));
  };

export const dropAnimationFinished = (id: DraggableId) =>
  (dispatch: Dispatch, getState: () => State): void => {
    const state: State = getState();

    if (state.phase !== 'DROP_ANIMATING') {
      console.error('cannot end drop that is no longer animating', state);
      dispatch(cancel(id));
      return;
    }

    if (!state.drop || !state.drop.pending) {
      console.error('cannot end drop that has no pending state', state);
      dispatch(cancel(id));
      return;
    }

    dispatch(completeDrop(state.drop.pending.result));
  };

export type LiftAction = {|
  type: 'LIFT',
  payload: {|
    id: DraggableId,
    type: TypeId,
    client: InitialDragLocation,
    page: InitialDragLocation,
    windowScroll: Position,
  |}
|}

// using redux-thunk
export const lift = (id: DraggableId,
  type: TypeId,
  client: InitialDragLocation,
  page: InitialDragLocation,
  windowScroll: Position,
) => (dispatch: Dispatch, getState: Function) => {
  (() => {
    const state: State = getState();
    // quickly finish any current animations
    if (state.phase === 'DROP_ANIMATING') {
      if (!state.drop || !state.drop.pending) {
        console.error('cannot flush drop animation if there is no pending');
        dispatch(cancel('super cool id'));
        return;
      }
      dispatch(completeDrop(state.drop.pending.result));
    }
  })();

  // https://github.com/chenglou/react-motion/issues/437
  // need to allow a flush of react-motion
  setTimeout(() => {
    const state: State = getState();

    if (state.phase !== 'IDLE' || state.phase !== 'DRAG_COMPLETE') {
      // TODO: cancel does not need an id
      dispatch(cancel('some-fake-id'));
    }

    dispatch(beginLift());
    dispatch(requestDimensions(type));

    // Dimensions will be requested synronously
    // after they are done - lift.
    // Could improve this by explicitly waiting until all dimensions are published.
    // Could also allow a lift to occur before all the dimensions are published
    setTimeout(() => {
      const newState: State = getState();

      // drag was already cancelled before dimensions all collected
      if (newState.phase !== 'COLLECTING_DIMENSIONS') {
        return;
      }
      dispatch(completeLift(id, type, client, page, windowScroll));
    });
  });
};

export type Action = BeginLiftAction |
  CompleteLiftAction |
  RequestDimensionsAction |
  PublishDraggableDimensionAction |
  PublishDroppableDimensionAction |
  MoveAction |
  MoveBackwardAction |
  MoveForwardAction |
  DropAnimateAction |
  DropCompleteAction |
  CancelAction;
