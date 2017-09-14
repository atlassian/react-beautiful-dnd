// @flow
import type {
  DraggableId,
  DroppableId,
  DropResult,
  TypeId,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  InitialDragLocation,
  Position,
  Dispatch,
  State,
  DropTrigger,
  CurrentDrag,
  InitialDrag,
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

  const droppableScrollDiff: Position = droppable ? subtract(
    droppable.scroll.initial,
    droppable.scroll.current
  ) : origin;

  return add(windowScrollDiff, droppableScrollDiff);
};

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
    isScrollAllowed: boolean,
  |}
|}

const completeLift = (id: DraggableId,
  type: TypeId,
  client: InitialDragLocation,
  page: InitialDragLocation,
  windowScroll: Position,
  isScrollAllowed: boolean,
): CompleteLiftAction => ({
  type: 'COMPLETE_LIFT',
  payload: {
    id,
    type,
    client,
    page,
    windowScroll,
    isScrollAllowed,
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

    // This can occur if the user ends a drag before
    // the collecting phase is finished.
    // This will not trigger a hook as the hook waits
    // for a DRAGGING phase before firing a onDragStart
    if (state.phase === 'COLLECTING_DIMENSIONS') {
      console.error('canceling drag while collecting');
      dispatch(clean());
      return;
    }

    if (state.phase !== 'DRAGGING') {
      console.error('cannot drop if not dragging', state);
      dispatch(clean());
      return;
    }

    if (!state.drag) {
      console.error('invalid drag state', state);
      dispatch(clean());
      return;
    }

    const { impact, initial, current } = state.drag;
    const droppable: ?DroppableDimension = impact.destination ?
      state.dimension.droppable[impact.destination.droppableId] :
      null;
    const draggable: DraggableDimension = state.dimension.draggable[current.id];

    const result: DropResult = {
      draggableId: current.id,
      type: current.type,
      source: initial.source,
      destination: impact.destination,
    };

    const newCenter: Position = getNewHomeClientCenter({
      movement: impact.movement,
      draggable,
      draggables: state.dimension.draggable,
      destination: droppable,
    });

    const clientOffset: Position = subtract(newCenter, draggable.client.withMargin.center);
    const scrollDiff: Position = getScrollDiff({ initial, current, droppable });
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
    const droppable: DroppableDimension = state.dimension.droppable[initial.source.droppableId];

    const result: DropResult = {
      draggableId: current.id,
      type: current.type,
      source: initial.source,
      // no destination when cancelling
      destination: null,
    };

    const isAnimationRequired = !isEqual(current.client.offset, origin);

    if (!isAnimationRequired) {
      dispatch(completeDrop(result));
      return;
    }

    const scrollDiff: Position = getScrollDiff({ initial, current, droppable });

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
    type: TypeId,
    client: InitialDragLocation,
    page: InitialDragLocation,
    windowScroll: Position,
    isScrollAllowed: boolean,
  |}
|}

// using redux-thunk
export const lift = (id: DraggableId,
  type: TypeId,
  client: InitialDragLocation,
  page: InitialDragLocation,
  windowScroll: Position,
  isScrollAllowed: boolean,
) => (dispatch: Dispatch, getState: Function) => {
  (() => {
    const state: State = getState();
    // quickly finish any current animations
    if (state.phase === 'DROP_ANIMATING') {
      if (!state.drop || !state.drop.pending) {
        console.error('cannot flush drop animation if there is no pending');
        dispatch(clean());
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
      dispatch(clean());
    }

    dispatch(beginLift());
    dispatch(requestDimensions(type));

    // Dimensions will be requested synchronously
    // after they are done - lift.
    // Could improve this by explicitly waiting until all dimensions are published.
    // Could also allow a lift to occur before all the dimensions are published
    setTimeout(() => {
      const newState: State = getState();

      // drag was already cancelled before dimensions all collected
      if (newState.phase !== 'COLLECTING_DIMENSIONS') {
        return;
      }
      dispatch(completeLift(id, type, client, page, windowScroll, isScrollAllowed));
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
  CrossAxisMoveForwardAction |
  CrossAxisMoveBackwardAction |
  DropAnimateAction |
  DropCompleteAction |
  CleanAction;
