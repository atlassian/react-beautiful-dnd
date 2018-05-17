// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import type {
  Action,
  State,
  DraggableDimension,
  DroppableDimension,
  DroppableId,
  DraggableId,
  DraggableDescriptor,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DropReason,
  DraggableLocation,
  LiftRequest,
  PendingDrop,
  Viewport,
  IdleState,
  PreparingState,
  Critical,
  ItemPositions,
  DragPositions,
  InitialCollectionState,
  DraggingState,
  BulkCollectionState,
  DropAnimatingState,
  DropPendingState,
  DropCompleteState,
  DragImpact,
  WindowDetails,
  DimensionMap,
} from '../types';
import { add, subtract, isEqual, negate } from './position';
import noImpact, { noMovement } from './no-impact';
import getDragImpact from './get-drag-impact/';
import moveToNextIndex from './move-to-next-index/';
import type { Result as MoveToNextResult } from './move-to-next-index/move-to-next-index-types';
import type { Result as MoveCrossAxisResult } from './move-cross-axis/move-cross-axis-types';
import moveCrossAxis from './move-cross-axis/';
import { scrollDroppable } from './droppable-dimension';
import scrollWindowDetails from './scroll-window-details';

const origin: Position = { x: 0, y: 0 };

const idle: IdleState = { phase: 'IDLE' };

type MoveArgs = {|
  state: State,
  clientSelection: Position,
  shouldAnimate: boolean,
  windowDetails?: WindowDetails,
  // force a custom drag impact
  impact?: ?DragImpact,
  // provide a scroll jump request (optionally provided - and can be null)
  scrollJumpRequest?: ?Position
|}

// Using function declaration as arrow function does not play well with the %checks syntax
function isMovementAllowed(state: State): boolean %checks {
  return state.phase === 'DRAGGING' || state.phase === 'BULK_COLLECTING';
}

const moveWithPositionUpdates = ({
  state,
  clientSelection,
  shouldAnimate,
  windowDetails,
  impact,
  scrollJumpRequest,
}: MoveArgs): BulkCollectionState | DraggingState | DropPendingState => {
  // DRAGGING: can update position and impact
  // BULK_COLLECTING: can update position but cannot update impact

  invariant(isMovementAllowed(state), `Attempting to move in an unsupported phase ${state.phase}`);

  const client: ItemPositions = (() => {
    const offset: Position = subtract(clientSelection, state.initial.client.selection);

    return {
      offset,
      selection: clientSelection,
      borderBoxCenter: add(offset, state.initial.client.borderBoxCenter),
    };
  })();

  const page: ItemPositions = {
    selection: add(client.selection, state.window.scroll.current),
    offset: add(client.offset, state.window.scroll.current),
    borderBoxCenter: add(client.borderBoxCenter, state.window.scroll.current),
  };
  const current: DragPositions = {
    client, page,
  };

  // Not updating impact while bulk collecting
  if (state.phase === 'BULK_COLLECTING') {
    return {
      // adding phase to appease flow (even though it will be overwritten by spread)
      phase: 'BULK_COLLECTING',
      ...state,
      current,
    };
  }

  const newImpact: DragImpact = impact || getDragImpact({
    pageBorderBoxCenter: current.page.borderBoxCenter,
    draggable: state.dimensions.draggables[state.critical.draggable.id],
    draggables: state.dimensions.draggables,
    droppables: state.dimensions.droppables,
    previousImpact: state.impact,
    viewport: windowDetails ? windowDetails.viewport : state.window.viewport,
  });

  // dragging!
  const result: DraggingState = {
    ...state,
    current,
    shouldAnimate,
    impact: newImpact,
    scrollJumpRequest,
    window: windowDetails || state.window,
  };

  return result;
};

export default (state: State = idle, action: Action): State => {
  if (action.type === 'CLEAN') {
    return idle;
  }

  if (action.type === 'PREPARE') {
    const result: PreparingState = {
      phase: 'PREPARING',
    };
    return result;
  }

  if (action.type === 'INITIAL_PUBLISH') {
    invariant(state.phase === 'PREPARING', 'INITIAL_PUBLISH must come after a PREPARING phase');
    const { critical, client, viewport, dimensions, autoScrollMode } = action.payload;
    const windowDetails: WindowDetails = {
      viewport,
      scroll: {
        initial: viewport.scroll,
        current: viewport.scroll,
        diff: {
          value: origin,
          displacement: origin,
        },
      },
    };

    const initial: DragPositions = {
      client,
      page: {
        selection: add(client.selection, windowDetails.scroll.initial),
        borderBoxCenter: add(client.selection, windowDetails.scroll.initial),
        offset: client.offset,
      },
    };

    const droppable: DroppableDimension = dimensions.droppables[critical.droppable.id];

    // Calculating initial impact
    const impact: DragImpact = {
      movement: noMovement,
      direction: droppable.axis.direction,
      destination: {
        index: critical.draggable.index,
        droppableId: critical.droppable.id,
      },
    };

    const result: BulkCollectionState = {
      // We are now waiting for the first bulk collection.
      phase: 'BULK_COLLECTING',
      critical,
      autoScrollMode,
      dimensions,
      initial,
      current: initial,
      impact,
      window: windowDetails,
      scrollJumpRequest: null,
      shouldAnimate: false,
    };

    return result;
  }

  if (action.type === 'BULK_COLLECTION_STARTING') {
    // A collection might have restarted. We do not care as we are already in the right phase
    if (state.phase === 'BULK_COLLECTING' || state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(state.phase === 'DRAGGING', `Bulk collection cannot start from phase ${state.phase}`);

    const result: BulkCollectionState = {
      // putting phase first to appease flow
      phase: 'BULK_COLLECTING',
      ...state,
      // eslint-disable-next-line no-dupe-keys
      phase: 'BULK_COLLECTING',
    };

    return result;
  }

  if (action.type === 'BULK_REPLACE') {
    // Unexpected bulk publish
    invariant(
      state.phase === 'BULK_COLLECTING' || state.phase === 'DROP_PENDING',
      `Unexpected bulk publish received in phase ${state.phase}`
    );

    const existing: BulkCollectionState | DropPendingState = state;

    const { viewport, critical, dimensions: proposed } = action.payload;
    const dimensions: DimensionMap = (() => {
      // new dimensions contain the critical dimensions - we can just use those
      if (critical) {
        return proposed;
      }

      // need to maintain critical dimensions as they where not collected
      const draggable: DraggableDimension =
        existing.dimensions.draggables[existing.critical.draggable.id];
      const droppable: DroppableDimension =
        existing.dimensions.droppables[existing.critical.droppable.id];

      return {
        draggables: {
          ...proposed.draggables,
          [draggable.descriptor.id]: draggable,
        },
        droppables: {
          ...proposed.droppables,
          [droppable.descriptor.id]: droppable,
        },
      };
    })();

    const impact: DragImpact = getDragImpact({
      pageBorderBoxCenter: state.current.page.borderBoxCenter,
      draggable: dimensions.draggables[state.critical.draggable.id],
      draggables: dimensions.draggables,
      droppables: dimensions.droppables,
      previousImpact: state.impact,
      viewport,
    });

    const windowDetails: WindowDetails = {
      viewport,
      scroll: {
        initial: viewport.scroll,
        current: viewport.scroll,
        diff: {
          value: origin,
          displacement: origin,
        },
      },
    };

    // The starting index of a draggable can change during a drag
    const newCritical: Critical = critical || state.critical;

    // Moving into the DRAGGING phase
    if (state.phase === 'BULK_COLLECTING') {
      return {
        // appeasing flow
        phase: 'DRAGGING',
        ...state,
        // eslint-disable-next-line
        phase: 'DRAGGING',
        critical: newCritical,
        impact,
        dimensions,
        window: windowDetails,
      };
    }

    // There was a DROP_PENDING
    // Staying in the DROP_PENDING phase
    // setting isWaiting for false
    return {
      // appeasing flow
      phase: 'DROP_PENDING',
      ...state,
      // eslint-disable-next-line
        phase: 'DROP_PENDING',
      impact,
      dimensions,
      critical: newCritical,
      window: windowDetails,
      // No longer waiting
      isWaiting: false,
    };
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

    const { client, shouldAnimate } = action.payload;

    return moveWithPositionUpdates({
      state,
      clientSelection: client,
      shouldAnimate,
    });
  }

  if (action.type === 'UPDATE_DROPPABLE_SCROLL') {
    // Not allowing changes while a drop is pending
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(isMovementAllowed(state), `Attempting to update droppable scroll in an unsupported phase: ${state.phase}`);

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
        viewport: state.window.viewport,
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
      viewport: state.window.viewport,
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
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(isMovementAllowed(state), `Cannot move by window in phase ${state.phase}`);

    const newScroll: Position = action.payload.scroll;

    if (isEqual(state.window.scroll.current, newScroll)) {
      return state;
    }

    const isJumpScrolling: boolean = state.autoScrollMode === 'JUMP';

    // If we are jump scrolling - any window scrolls should not update the impact
    const impact: ?DragImpact = isJumpScrolling ? state.impact : null;

    const windowDetails: WindowDetails = scrollWindowDetails(state.window, newScroll);

    return moveWithPositionUpdates({
      state,
      clientSelection: state.current.client.selection,
      windowDetails,
      shouldAnimate: false,
      impact,
    });
  }

  if (action.type === 'MOVE_FORWARD' || action.type === 'MOVE_BACKWARD') {
    if (state.phase === 'BULK_COLLECTING' || state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(state.phase === 'DRAGGING', `${action.type} received while not in DRAGGING phase`);
    invariant(state.impact.destination, `Cannot ${action.type} if there is no previous destination`);

    const isMovingForward: boolean = action.type === 'MOVE_FORWARD';

    const droppable: DroppableDimension = state.dimensions.droppables[
      state.impact.destination.droppableId
    ];

    const result: ?MoveToNextResult = moveToNextIndex({
      isMovingForward,
      draggableId: state.critical.draggable.id,
      droppable,
      draggables: state.dimensions.draggables,
      previousPageBorderBoxCenter: state.current.page.borderBoxCenter,
      previousImpact: state.impact,
      viewport: state.window.viewport,
    });

    // cannot move anyway (at the beginning or end of a list)
    if (!result) {
      return state;
    }

    const impact: DragImpact = result.impact;
    const pageBorderBoxCenter: Position = result.pageBorderBoxCenter;
    // TODO: not sure if this is correct
    const clientBorderBoxCenter: Position = subtract(
      pageBorderBoxCenter, state.window.scroll.current,
    );

    return moveWithPositionUpdates({
      state,
      impact,
      clientSelection: clientBorderBoxCenter,
      shouldAnimate: true,
      scrollJumpRequest: result.scrollJumpRequest,
    });
  }

  if (action.type === 'CROSS_AXIS_MOVE_FORWARD' || action.type === 'CROSS_AXIS_MOVE_BACKWARD') {
    if (state.phase === 'BULK_COLLECTING' || state.phase === 'DROP_PENDING') {
      return state;
    }

    invariant(state.phase === 'DRAGGING', `${action.type} received while not in DRAGGING phase`);
    invariant(state.impact.destination, `Cannot ${action.type} if there is no previous destination`);

    const home: DraggableLocation = {
      index: state.critical.draggable.index,
      droppableId: state.critical.droppable.id,
    };

    const result: ?MoveCrossAxisResult = moveCrossAxis({
      isMovingForward: action.type === 'CROSS_AXIS_MOVE_FORWARD',
      pageBorderBoxCenter: state.current.page.borderBoxCenter,
      draggableId: state.critical.draggable.id,
      droppableId: state.impact.destination.droppableId,
      home,
      draggables: state.dimensions.draggables,
      droppables: state.dimensions.droppables,
      previousImpact: state.impact,
      viewport: state.window.viewport,
    });

    if (!result) {
      return state;
    }

    const page: Position = result.pageBorderBoxCenter;
    const client: Position = subtract(page, state.window.viewport.scroll);

    return moveWithPositionUpdates({
      state,
      clientSelection: client,
      impact: result.impact,
      shouldAnimate: true,
    });
  }

  if (action.type === 'DROP_PENDING') {
    const reason: DropReason = action.payload.reason;
    invariant(state.phase === 'BULK_COLLECTING',
      'Can only move into the DROP_PENDING phase from the BULK_COLLECTING phase');

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
