// @flow
import type { Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import { scrollDroppable } from './droppable-dimension';
import getDragImpact from './get-drag-impact/';
import moveCrossAxis from './move-cross-axis/';
import moveToNextIndex from './move-to-next-index/';
import { noMovement } from './no-impact';
import publish from './publish';
import { add, isEqual, subtract } from './position';
import scrollViewport from './scroll-viewport';
import getHomeImpact from './get-home-impact';
import type {
  Action,
  State,
  DraggableDimension,
  DroppableDimension,
  DraggableLocation,
  PendingDrop,
  IdleState,
  PreparingState,
  DraggingState,
  Critical,
  ItemPositions,
  DragPositions,
  CollectingState,
  DropAnimatingState,
  DropPendingState,
  DragImpact,
  Viewport,
  DimensionMap,
  DropReason,
  Direction,
} from '../types';
import type { Result as MoveToNextResult } from './move-to-next-index/move-to-next-index-types';
import type { Result as MoveCrossAxisResult } from './move-cross-axis/move-cross-axis-types';

const origin: Position = { x: 0, y: 0 };

const idle: IdleState = { phase: 'IDLE' };
const preparing: PreparingState = { phase: 'PREPARING' };

type MoveArgs = {|
  state: DraggingState | CollectingState,
  clientSelection: Position,
  shouldAnimate: boolean,
  viewport?: Viewport,
  // force a custom drag impact
  impact?: ?DragImpact,
  // provide a scroll jump request (optionally provided - and can be null)
  scrollJumpRequest?: ?Position
|}

// Using function declaration as arrow function does not play well with the %checks syntax
function isMovementAllowed(state: State): boolean %checks {
  return state.phase === 'DRAGGING' || state.phase === 'COLLECTING';
}

const moveWithPositionUpdates = ({
  state,
  clientSelection,
  shouldAnimate,
  viewport,
  impact,
  scrollJumpRequest,
}: MoveArgs): CollectingState | DraggingState => {
  // DRAGGING: can update position and impact
  // COLLECTING: can update position but cannot update impact

  const newViewport: Viewport = viewport || state.viewport;
  const currentWindowScroll: Position = newViewport.scroll.current;

  const client: ItemPositions = (() => {
    const offset: Position = subtract(clientSelection, state.initial.client.selection);
    return {
      offset,
      selection: clientSelection,
      borderBoxCenter: add(state.initial.client.borderBoxCenter, offset),
    };
  })();

  const page: ItemPositions = {
    selection: add(client.selection, currentWindowScroll),
    borderBoxCenter: add(client.borderBoxCenter, currentWindowScroll),
    offset: add(client.offset, currentWindowScroll),
  };
  const current: DragPositions = {
    client, page,
  };

  // Not updating impact while bulk collecting
  if (state.phase === 'COLLECTING') {
    return {
      // adding phase to appease flow (even though it will be overwritten by spread)
      phase: 'COLLECTING',
      ...state,
      current,
    };
  }

  const newImpact: DragImpact = impact || getDragImpact({
    pageBorderBoxCenter: page.borderBoxCenter,
    draggable: state.dimensions.draggables[state.critical.draggable.id],
    draggables: state.dimensions.draggables,
    droppables: state.dimensions.droppables,
    previousImpact: state.impact,
    viewport: newViewport,
  });

  // dragging!
  const result: DraggingState = {
    ...state,
    current,
    shouldAnimate,
    impact: newImpact,
    scrollJumpRequest,
    viewport: newViewport,
  };

  return result;
};

export default (state: State = idle, action: Action): State => {
  if (action.type === 'CLEAN') {
    return idle;
  }

  if (action.type === 'PREPARE') {
    return preparing;
  }

  if (action.type === 'INITIAL_PUBLISH') {
    invariant(state.phase === 'PREPARING', 'INITIAL_PUBLISH must come after a PREPARING phase');
    const { critical, client, viewport, dimensions, autoScrollMode } = action.payload;

    const initial: DragPositions = {
      client,
      page: {
        selection: add(client.selection, viewport.scroll.initial),
        borderBoxCenter: add(client.selection, viewport.scroll.initial),
        offset: origin,
      },
    };

    const result: DraggingState = {
      phase: 'DRAGGING',
      isDragging: true,
      critical,
      autoScrollMode,
      dimensions,
      initial,
      current: initial,
      impact: getHomeImpact(critical, dimensions),
      viewport,
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

    invariant(state.phase === 'DRAGGING', `Collection cannot start from phase ${state.phase}`);

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
      `Unexpected ${action.type} received in phase ${state.phase}`
    );

    console.log('result', publish({
      state,
      publish: action.payload,
    }));

    return publish({
      state,
      publish: action.payload,
    });
  }

  if (action.type === 'MOVE') {
    // Still preparing - ignore for now
    if (state.phase === 'PREPARING') {
      return state;
    }

    // Not allowing any more movements
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(isMovementAllowed(state), `${action.type} not permitted in phase ${state.phase}`);

    const { client, shouldAnimate } = action.payload;

    // If we are jump scrolling - manual movements should not update the impact
    const impact: ?DragImpact = state.autoScrollMode === 'JUMP' ? state.impact : null;

    return moveWithPositionUpdates({
      state,
      clientSelection: client,
      impact,
      shouldAnimate,
    });
  }

  if (action.type === 'UPDATE_DROPPABLE_SCROLL') {
    // Not allowing changes while a drop is pending
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(isMovementAllowed(state), `${action.type} not permitted in phase ${state.phase}`);

    const { id, offset } = action.payload;
    const target: ?DroppableDimension = state.dimensions.droppables[id];

    // This is possible if a droppable has been asked to watch scroll but
    // the dimension has not been published yet
    if (!target) {
      console.warn('cannot find target');
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
    };
  }

  if (action.type === 'UPDATE_DROPPABLE_IS_ENABLED') {
    // Things are locked at this point
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(isMovementAllowed(state), `Attempting to move in an unsupported phase ${state.phase}`);

    const { id, isEnabled } = action.payload;
    const target: ?DroppableDimension = state.dimensions.droppables[id];

    // This can happen if the enabled state changes on the droppable between
    // a onDragStart and the initial publishing of the Droppable.
    // The isEnabled state will be correctly populated when the Droppable dimension
    // is published. Therefore we do not need to log any error here
    if (!target) {
      return state;
    }

    invariant(target.isEnabled === isEnabled,
      `Trying to set droppable isEnabled to ${String(isEnabled)} but it is already ${String(isEnabled)}`);

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

    invariant(isMovementAllowed(state), `Cannot move by window in phase ${state.phase}`);

    const newScroll: Position = action.payload.scroll;

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

  if (action.type === 'MOVE_UP' || action.type === 'MOVE_DOWN' || action.type === 'MOVE_LEFT' || action.type === 'MOVE_RIGHT') {
    // Not doing keyboard movements during these phases
    if (state.phase === 'COLLECTING' || state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(state.phase === 'DRAGGING', `${action.type} received while not in DRAGGING phase`);

    const { droppable, isMainAxisMovementAllowed } = (() => {
      // appeasing flow
      invariant(state.phase === 'DRAGGING');

      if (state.impact.destination) {
        return {
          droppable: state.dimensions.droppables[state.impact.destination.droppableId],
          isMainAxisMovementAllowed: true,
        };
      }

      // No destination - this can happen when lifting an a disabled droppable
      // In this case we want to allow movement out of the list with a keyboard
      return {
        droppable: state.dimensions.droppables[state.critical.droppable.id],
        isMainAxisMovementAllowed: false,
      };
    })();

    const direction: Direction = droppable.axis.direction;
    const isMovingOnMainAxis: boolean =
      (direction === 'vertical' && (action.type === 'MOVE_UP' || action.type === 'MOVE_DOWN')) ||
      (direction === 'horizontal' && (action.type === 'MOVE_LEFT' || action.type === 'MOVE_RIGHT'));

    // This movement is not permitted right now
    if (isMovingOnMainAxis && !isMainAxisMovementAllowed) {
      return state;
    }

    const isMovingForward: boolean = action.type === 'MOVE_DOWN' || action.type === 'MOVE_RIGHT';

    if (isMovingOnMainAxis) {
      const result: ?MoveToNextResult = moveToNextIndex({
        isMovingForward,
        draggableId: state.critical.draggable.id,
        droppable,
        draggables: state.dimensions.draggables,
        previousPageBorderBoxCenter: state.current.page.borderBoxCenter,
        previousImpact: state.impact,
        viewport: state.viewport,
      });

      // Cannot move (at the beginning or end of a list)
      if (!result) {
        return state;
      }

      const impact: DragImpact = result.impact;
      const pageBorderBoxCenter: Position = result.pageBorderBoxCenter;
      // TODO: not sure if this is correct
      const clientBorderBoxCenter: Position = subtract(
        pageBorderBoxCenter, state.viewport.scroll.current,
      );

      return moveWithPositionUpdates({
        state,
        impact,
        clientSelection: clientBorderBoxCenter,
        shouldAnimate: true,
        scrollJumpRequest: result.scrollJumpRequest,
      });
    }

    // moving on cross axis

    const home: DraggableLocation = {
      index: state.critical.draggable.index,
      droppableId: state.critical.droppable.id,
    };

    const result: ?MoveCrossAxisResult = moveCrossAxis({
      isMovingForward,
      pageBorderBoxCenter: state.current.page.borderBoxCenter,
      draggableId: state.critical.draggable.id,
      droppableId: droppable.descriptor.id,
      home,
      draggables: state.dimensions.draggables,
      droppables: state.dimensions.droppables,
      previousImpact: state.impact,
      viewport: state.viewport,
    });

    if (!result) {
      return state;
    }

    const clientSelection: Position = subtract(
      result.pageBorderBoxCenter,
      state.viewport.scroll.current
    );

    return moveWithPositionUpdates({
      state,
      clientSelection,
      impact: result.impact,
      shouldAnimate: true,
    });
  }

  if (action.type === 'DROP_PENDING') {
    const reason: DropReason = action.payload.reason;
    invariant(state.phase === 'COLLECTING',
      'Can only move into the DROP_PENDING phase from the COLLECTING phase');

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
    invariant(state.phase === 'DRAGGING' || state.phase === 'DROP_PENDING',
      `Cannot animate drop from phase ${state.phase}`
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
