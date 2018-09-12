// @flow
import type { Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import { scrollDroppable } from './droppable-dimension';
import getDragImpact from './get-drag-impact';
import publish from './publish';
import moveInDirection, {
  type Result as MoveInDirectionResult,
} from './move-in-direction';
import { add, isEqual } from './position';
import scrollViewport from './scroll-viewport';
import getHomeImpact from './get-home-impact';
import isMovementAllowed from './is-movement-allowed';
import moveWithPositionUpdates from './move-with-position-updates';
import { toDroppableList } from './dimension-structures';
import type {
  State,
  DroppableDimension,
  PendingDrop,
  IdleState,
  DraggingState,
  DragPositions,
  CollectingState,
  DropAnimatingState,
  DropPendingState,
  DragImpact,
  Viewport,
  DimensionMap,
  DropReason,
} from '../types';
import type { Action } from './store-types';

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
      client,
      viewport,
      dimensions,
      autoScrollMode,
    } = action.payload;

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
    ).every((droppable: DroppableDimension) => !droppable.isFixedOnPage);

    console.log('isWindowScrollAllowed?', isWindowScrollAllowed);

    const result: DraggingState = {
      phase: 'DRAGGING',
      isDragging: true,
      critical,
      autoScrollMode,
      dimensions,
      initial,
      current: initial,
      isWindowScrollAllowed,
      impact: getHomeImpact(critical, dimensions),
      viewport,
      // TODO: what should the default be?
      direction: {
        vertical: 'down',
        horizontal: 'right',
      },
      scrollJumpRequest: null,
      shouldAnimate: false,
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

  if (action.type === 'PUBLISH') {
    // Unexpected bulk publish
    invariant(
      state.phase === 'COLLECTING' || state.phase === 'DROP_PENDING',
      `Unexpected ${action.type} received in phase ${state.phase}`,
    );

    return publish({
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

    const { client, shouldAnimate } = action.payload;

    // nothing needs to be done
    if (
      state.shouldAnimate === shouldAnimate &&
      isEqual(client, state.current.client.selection)
    ) {
      return state;
    }

    // If we are jump scrolling - manual movements should not update the impact
    const impact: ?DragImpact =
      state.autoScrollMode === 'JUMP' ? state.impact : null;

    return moveWithPositionUpdates({
      state,
      clientSelection: client,
      impact,
      shouldAnimate,
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

    const updated: DroppableDimension = scrollDroppable(target, offset);

    const dimensions: DimensionMap = {
      ...state.dimensions,
      droppables: {
        ...state.dimensions.droppables,
        [id]: updated,
      },
    };

    const impact: DragImpact = (() => {
      // flow is getting confused - so running this check again
      invariant(isMovementAllowed(state));

      // If we are jump scrolling - dimension changes should not update the impact
      if (state.autoScrollMode === 'JUMP') {
        return state.impact;
      }

      return getDragImpact({
        pageBorderBoxCenter: state.current.page.borderBoxCenter,
        draggable: dimensions.draggables[state.critical.draggable.id],
        draggables: dimensions.draggables,
        droppables: dimensions.droppables,
        previousImpact: state.impact,
        viewport: state.viewport,
        // TODO: is this correct?
        direction: state.direction,
      });
    })();

    return {
      // appeasing flow
      phase: 'DRAGGING',
      ...state,
      // eslint-disable-next-line
      phase: state.phase,
      impact,
      dimensions,
      // At this point any scroll jump request would need to be cleared
      scrollJumpRequest: null,
    };
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

    const dimensions: DimensionMap = {
      ...state.dimensions,
      droppables: {
        ...state.dimensions.droppables,
        [id]: updated,
      },
    };

    const impact: DragImpact = getDragImpact({
      pageBorderBoxCenter: state.current.page.borderBoxCenter,
      draggable: dimensions.draggables[state.critical.draggable.id],
      draggables: dimensions.draggables,
      droppables: dimensions.droppables,
      previousImpact: state.impact,
      viewport: state.viewport,
      direction: state.direction,
    });

    return {
      // appeasing flow - this placeholder phase will be overwritten by spread
      phase: 'DRAGGING',
      ...state,
      // eslint-disable-next-line
      phase: state.phase,
      impact,
      dimensions,
    };
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

    if (!state.isWindowScrollAllowed) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Window scrolling is currently not supported for fixed lists. Aborting drag',
        );
      }
      return idle;
    }

    const newScroll: Position = action.payload.scroll;

    // nothing needs to be done
    if (isEqual(state.viewport.scroll.current, newScroll)) {
      return state;
    }

    // If we are jump scrolling - any window scrolls should not update the impact
    const isJumpScrolling: boolean = state.autoScrollMode === 'JUMP';
    const impact: ?DragImpact = isJumpScrolling ? state.impact : null;

    const viewport: Viewport = scrollViewport(state.viewport, newScroll);

    return moveWithPositionUpdates({
      state,
      clientSelection: state.current.client.selection,
      viewport,
      shouldAnimate: false,
      impact,
    });
  }

  if (action.type === 'UPDATE_VIEWPORT_MAX_SCROLL') {
    invariant(
      state.isDragging,
      'Cannot update the max viewport scroll if not dragging',
    );
    const existing: Viewport = state.viewport;
    const viewport: Viewport = {
      ...existing,
      scroll: {
        ...existing.scroll,
        max: action.payload,
      },
    };

    return {
      // appeasing flow
      phase: 'DRAGGING',
      ...state,
      // eslint-disable-next-line
      phase: state.phase,
      viewport,
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

    // cannot mov in that direction
    if (!result) {
      return state;
    }

    return moveWithPositionUpdates({
      state,
      impact: result.impact,
      clientSelection: result.clientSelection,
      shouldAnimate: true,
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
      dimensions: state.dimensions,
    };

    return result;
  }

  // Action will be used by hooks to call consumers
  // We can simply return to the idle state
  if (action.type === 'DROP_COMPLETE') {
    return idle;
  }

  return state;
};
