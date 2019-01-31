// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type {
  DimensionMap,
  State,
  StateWhenUpdatesAllowed,
  DraggableDimension,
  DroppableDimension,
  PendingDrop,
  IdleState,
  DraggingState,
  DragPositions,
  ClientPositions,
  CollectingState,
  DropAnimatingState,
  DropPendingState,
  Viewport,
  DropReason,
  Displacement,
  DraggableIdMap,
  DragImpact,
} from '../types';
import type { Action } from './store-types';
import type { PublicResult as MoveInDirectionResult } from './move-in-direction/move-in-direction-types';
import scrollDroppable from './droppable/scroll-droppable';
import publishWhileDragging from './publish-while-dragging';
// import moveInDirection from './move-in-direction';
import { add, isEqual, origin } from './position';
import scrollViewport from './scroll-viewport';
import getHomeImpact from './get-home-impact.old';
import isMovementAllowed from './is-movement-allowed';
import { toDroppableList } from './dimension-structures';
import { forward } from './user-direction/user-direction-preset';
import update from './post-reducer/when-moving/update';
import refreshSnap from './post-reducer/when-moving/refresh-snap';
import patchDroppableMap from './patch-droppable-map';
import getHomeOnLift from './get-home-on-lift';

const isSnapping = (state: StateWhenUpdatesAllowed): boolean =>
  state.movementMode === 'SNAP';

const postDroppableChange = (
  state: StateWhenUpdatesAllowed,
  updated: DroppableDimension,
  isEnabledChanging: boolean,
): StateWhenUpdatesAllowed => {
  const dimensions: DimensionMap = patchDroppableMap(state.dimensions, updated);

  // if the enabled state is changing, we need to force a update
  if (!isSnapping(state) || isEnabledChanging) {
    return update({
      state,
      dimensions,
    });
  }

  return refreshSnap({
    state,
    dimensions,
  });
};

const idle: IdleState = { phase: 'IDLE' };

export default (state: State = idle, action: Action): State => {
  if (action.type === 'CLEAN') {
    return idle;
  }

  if (action.type === 'INITIAL_PUBLISH') {
    invariant(
      state.phase === 'IDLE',
      'INITIAL_PUBLISH must come after a IDLE phase',
    );
    const {
      critical,
      clientSelection,
      viewport,
      dimensions,
      movementMode,
    } = action.payload;

    const draggable: DraggableDimension =
      dimensions.draggables[critical.draggable.id];
    const home: DroppableDimension =
      dimensions.droppables[critical.droppable.id];

    const client: ClientPositions = {
      selection: clientSelection,
      borderBoxCenter: draggable.client.borderBox.center,
      offset: origin,
    };

    const initial: DragPositions = {
      client,
      page: {
        selection: add(client.selection, viewport.scroll.initial),
        borderBoxCenter: add(client.selection, viewport.scroll.initial),
      },
    };

    // Can only auto scroll the window if every list is not fixed on the page
    const isWindowScrollAllowed: boolean = toDroppableList(
      dimensions.droppables,
    ).every((item: DroppableDimension) => !item.isFixedOnPage);

    const { impact, onLift } = getHomeOnLift({
      draggable,
      home,
      draggables: dimensions.draggables,
      viewport,
    });

    const result: DraggingState = {
      phase: 'DRAGGING',
      isDragging: true,
      critical,
      movementMode,
      dimensions,
      initial,
      current: initial,
      isWindowScrollAllowed,
      impact,
      onLift,
      onLiftImpact: impact,
      // only will animate home placeholder after
      // a foreign list has been dragged over
      // TODO: can this be a one time flag that is swapped after first render?
      shouldAnimateHomePlaceholder: false,
      viewport,
      userDirection: forward,
      scrollJumpRequest: null,
      forceShouldAnimate: null,
    };

    return result;
  }

  if (action.type === 'COLLECTION_STARTING') {
    // A collection might have restarted. We do not care as we are already in the right phase
    // TODO: remove?
    if (state.phase === 'COLLECTING' || state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(
      state.phase === 'DRAGGING',
      `Collection cannot start from phase ${state.phase}`,
    );

    const result: CollectingState = {
      // putting phase first to appease flow
      phase: 'COLLECTING',
      ...state,
      // eslint-disable-next-line
      phase: 'COLLECTING',
    };

    return result;
  }

  if (action.type === 'PUBLISH_WHILE_DRAGGING') {
    // Unexpected bulk publish
    invariant(
      state.phase === 'COLLECTING' || state.phase === 'DROP_PENDING',
      `Unexpected ${action.type} received in phase ${state.phase}`,
    );

    return publishWhileDragging({
      state,
      published: action.payload,
    });
  }

  if (action.type === 'MOVE') {
    // Not allowing any more movements
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(
      isMovementAllowed(state),
      `${action.type} not permitted in phase ${state.phase}`,
    );

    const { client: clientSelection } = action.payload;

    // nothing needs to be done
    if (isEqual(clientSelection, state.current.client.selection)) {
      return state;
    }

    return update({
      state,
      clientSelection,
      // If we are snap moving - manual movements should not update the impact
      impact: isSnapping(state) ? state.impact : null,
    });
  }

  if (action.type === 'UPDATE_DROPPABLE_SCROLL') {
    // Not allowing changes while a drop is pending
    // Cannot get this during a DROP_ANIMATING as the dimension
    // marshal will cancel any pending scroll updates
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    // We will be updating the scroll in response to dynamic changes
    // manually on the droppable so we can ignore this change
    if (state.phase === 'COLLECTING') {
      return state;
    }

    invariant(
      isMovementAllowed(state),
      `${action.type} not permitted in phase ${state.phase}`,
    );

    const { id, offset } = action.payload;
    const target: ?DroppableDimension = state.dimensions.droppables[id];

    // This is possible if a droppable has been asked to watch scroll but
    // the dimension has not been published yet
    if (!target) {
      return state;
    }

    const scrolled: DroppableDimension = scrollDroppable(target, offset);
    return postDroppableChange(state, scrolled, false);
  }

  if (action.type === 'UPDATE_DROPPABLE_IS_ENABLED') {
    // Things are locked at this point
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(
      isMovementAllowed(state),
      `Attempting to move in an unsupported phase ${state.phase}`,
    );

    const { id, isEnabled } = action.payload;
    const target: ?DroppableDimension = state.dimensions.droppables[id];

    invariant(
      target,
      `Cannot find Droppable[id: ${id}] to toggle its enabled state`,
    );

    invariant(
      target.isEnabled !== isEnabled,
      `Trying to set droppable isEnabled to ${String(isEnabled)}
      but it is already ${String(target.isEnabled)}`,
    );

    const updated: DroppableDimension = {
      ...target,
      isEnabled,
    };

    return postDroppableChange(state, updated, true);
  }

  if (action.type === 'UPDATE_DROPPABLE_IS_COMBINE_ENABLED') {
    // Things are locked at this point
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(
      isMovementAllowed(state),
      `Attempting to move in an unsupported phase ${state.phase}`,
    );

    const { id, isCombineEnabled } = action.payload;
    const target: ?DroppableDimension = state.dimensions.droppables[id];

    invariant(
      target,
      `Cannot find Droppable[id: ${id}] to toggle its isCombineEnabled state`,
    );

    invariant(
      target.isCombineEnabled !== isCombineEnabled,
      `Trying to set droppable isCombineEnabled to ${String(isCombineEnabled)}
      but it is already ${String(target.isCombineEnabled)}`,
    );

    const updated: DroppableDimension = {
      ...target,
      isCombineEnabled,
    };

    return postDroppableChange(state, updated, true);
  }

  if (action.type === 'MOVE_BY_WINDOW_SCROLL') {
    // No longer accepting changes
    if (state.phase === 'DROP_PENDING' || state.phase === 'DROP_ANIMATING') {
      return state;
    }

    invariant(
      isMovementAllowed(state),
      `Cannot move by window in phase ${state.phase}`,
    );

    invariant(
      state.isWindowScrollAllowed,
      'Window scrolling is currently not supported for fixed lists. Aborting drag',
    );

    const newScroll: Position = action.payload.newScroll;

    // nothing needs to be done
    if (isEqual(state.viewport.scroll.current, newScroll)) {
      return state;
    }

    const viewport: Viewport = scrollViewport(state.viewport, newScroll);

    if (isSnapping(state)) {
      return refreshSnap({
        state,
        viewport,
      });
    }

    return update({
      state,
      viewport,
    });
  }

  if (action.type === 'UPDATE_VIEWPORT_MAX_SCROLL') {
    // Could occur if a transitionEnd occurs after a drag ends
    if (!isMovementAllowed(state)) {
      console.warn('TODO: remove this - dropping max window scroll update');
      return state;
    }

    const maxScroll: Position = action.payload.maxScroll;

    if (isEqual(maxScroll, state.viewport.scroll.max)) {
      return state;
    }

    const withMaxScroll: Viewport = {
      ...state.viewport,
      scroll: {
        ...state.viewport.scroll,
        max: maxScroll,
      },
    };

    // don't need to recalc any updates
    return {
      // phase will be overridden - appeasing flow
      phase: 'DRAGGING',
      ...state,
      viewport: withMaxScroll,
    };
  }
  if (
    action.type === 'MOVE_UP' ||
    action.type === 'MOVE_DOWN' ||
    action.type === 'MOVE_LEFT' ||
    action.type === 'MOVE_RIGHT'
  ) {
    // Not doing keyboard movements during these phases
    if (state.phase === 'COLLECTING' || state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(
      state.phase === 'DRAGGING',
      `${action.type} received while not in DRAGGING phase`,
    );

    const result: ?MoveInDirectionResult = moveInDirection({
      state,
      type: action.type,
    });

    // cannot move in that direction
    if (!result) {
      return state;
    }

    return update({
      state,
      impact: result.impact,
      clientSelection: result.clientSelection,
      scrollJumpRequest: result.scrollJumpRequest,
    });
  }

  if (action.type === 'DROP_PENDING') {
    const reason: DropReason = action.payload.reason;
    invariant(
      state.phase === 'COLLECTING',
      'Can only move into the DROP_PENDING phase from the COLLECTING phase',
    );

    const newState: DropPendingState = {
      // appeasing flow
      phase: 'DROP_PENDING',
      ...state,
      // eslint-disable-next-line
      phase: 'DROP_PENDING',
      isWaiting: true,
      reason,
    };
    return newState;
  }

  if (action.type === 'DROP_ANIMATE') {
    const pending: PendingDrop = action.payload;
    invariant(
      state.phase === 'DRAGGING' || state.phase === 'DROP_PENDING',
      `Cannot animate drop from phase ${state.phase}`,
    );

    // Moving into a new phase
    const result: DropAnimatingState = {
      phase: 'DROP_ANIMATING',
      pending,
      shouldAnimateHomePlaceholder: state.shouldAnimateHomePlaceholder,
      dimensions: state.dimensions,
    };

    return result;
  }

  // Action will be used by responders to call consumers
  // We can simply return to the idle state
  if (action.type === 'DROP_COMPLETE') {
    return idle;
  }

  return state;
};
