// @flow
import type { Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import { scrollDroppable } from './droppable-dimension';
import getDragImpact from './get-drag-impact/';
import moveCrossAxis from './move-cross-axis/';
import moveToNextIndex from './move-to-next-index/';
import { noMovement } from './no-impact';
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
  BulkCollectionState,
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

type MoveArgs = {|
  state: State,
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
  return state.phase === 'DRAGGING' || state.phase === 'BULK_COLLECTING';
}

const moveWithPositionUpdates = ({
  state,
  clientSelection,
  shouldAnimate,
  viewport,
  impact,
  scrollJumpRequest,
}: MoveArgs): BulkCollectionState | DraggingState | DropPendingState => {
  // DRAGGING: can update position and impact
  // BULK_COLLECTING: can update position but cannot update impact

  invariant(isMovementAllowed(state), `Attempting to move in an unsupported phase ${state.phase}`);

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
    offset: add(client.offset, currentWindowScroll),
    borderBoxCenter: add(client.borderBoxCenter, currentWindowScroll),
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
    const result: PreparingState = {
      phase: 'PREPARING',
    };
    return result;
  }

  if (action.type === 'INITIAL_PUBLISH') {
    invariant(state.phase === 'PREPARING', 'INITIAL_PUBLISH must come after a PREPARING phase');
    const { critical, client, viewport, dimensions, autoScrollMode } = action.payload;

    const initial: DragPositions = {
      client,
      page: {
        selection: add(client.selection, viewport.scroll.initial),
        borderBoxCenter: add(client.selection, viewport.scroll.initial),
        offset: client.offset,
      },
    };

    // Calculating initial impact
    const impact: DragImpact = getHomeImpact(critical, dimensions.droppables);

    const result: BulkCollectionState = {
      // We are now waiting for the first bulk collection.
      phase: 'BULK_COLLECTING',
      critical,
      autoScrollMode,
      dimensions,
      initial,
      current: initial,
      impact,
      viewport,
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

    const { viewport, critical, dimensions: suppliedDimensions } = action.payload;

    if (!critical) {
      // need to maintain critical dimensions as they where not collected
      const draggable: DraggableDimension =
        state.dimensions.draggables[state.critical.draggable.id];
      const droppable: DroppableDimension =
        state.dimensions.droppables[state.critical.droppable.id];

      const dimensions: DimensionMap = {
        draggables: {
          ...suppliedDimensions.draggables,
          [draggable.descriptor.id]: draggable,
        },
        droppables: {
          ...suppliedDimensions.droppables,
          [droppable.descriptor.id]: droppable,
        },
      };

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter: state.current.page.borderBoxCenter,
        draggable: dimensions.draggables[state.critical.draggable.id],
        draggables: dimensions.draggables,
        droppables: dimensions.droppables,
        previousImpact: state.impact,
        viewport,
      });

      const draggingState: DraggingState = {
        // appeasing flow
        phase: 'DRAGGING',
        ...state,
        // eslint-disable-next-line
        phase: 'DRAGGING',
        impact,
        viewport,
        dimensions,
      };

      if (state.phase === 'BULK_COLLECTING') {
        return draggingState;
      }

      // There was a DROP_PENDING
      // Staying in the DROP_PENDING phase
      // setting isWaiting for false

      const dropPending: DropPendingState = {
        // appeasing flow
        phase: 'DROP_PENDING',
        ...draggingState,
        // eslint-disable-next-line
        phase: 'DROP_PENDING',
        // No longer waiting
        reason: state.reason,
        isWaiting: false,
      };

      return dropPending;
    }

    console.log('replacing critical dimension');

    // replacing the critical dimensions!!
    const oldBorderBoxCenter: Position = state.initial.client.borderBoxCenter;
    const draggable: DraggableDimension = suppliedDimensions.draggables[critical.draggable.id];
    const newBorderBoxCenter: Position = draggable.client.borderBox.center;
    const centerDiff: Position = subtract(newBorderBoxCenter, oldBorderBoxCenter);

    const oldInitialClientSelection: Position = state.initial.client.selection;
    const newInitialClientSelection: Position = add(oldInitialClientSelection, centerDiff);

    // Need to figure out what the initial and current positions should be
    const initial: DragPositions = {
      client: {
        selection: newInitialClientSelection,
        borderBoxCenter: newBorderBoxCenter,
        offset: origin,
      },
      page: {
        selection: add(newInitialClientSelection, viewport.scroll.initial),
        borderBoxCenter: add(newBorderBoxCenter, viewport.scroll.initial),
        offset: add(origin, viewport.scroll.initial),
      },
    };

    const newCurrentOffset: Position = subtract(state.current.client.offset, centerDiff);

    const current: DragPositions = (() => {
      const client: ItemPositions = {
        selection: add(initial.client.selection, newCurrentOffset),
        borderBoxCenter: add(initial.client.borderBoxCenter, newCurrentOffset),
        offset: newCurrentOffset,
      };
      const page: ItemPositions = {
        selection: add(client.selection, viewport.scroll.current),
        borderBoxCenter: add(client.borderBoxCenter, viewport.scroll.current),
        offset: add(client.offset, viewport.scroll.current),
      };
      return { client, page };
    })();

    const impact: DragImpact = getDragImpact({
      pageBorderBoxCenter: current.page.borderBoxCenter,
      draggable: suppliedDimensions.draggables[critical.draggable.id],
      draggables: suppliedDimensions.draggables,
      droppables: suppliedDimensions.droppables,
      previousImpact: state.impact,
      viewport,
    });

    const draggingState: DraggingState = {
      // appeasing flow
      phase: 'DRAGGING',
      ...state,
      // eslint-disable-next-line
      phase: 'DRAGGING',
      impact,
      viewport,
      initial,
      current,
      dimensions: suppliedDimensions,
    };

    if (state.phase === 'BULK_COLLECTING') {
      return draggingState;
    }

    // There was a DROP_PENDING
    // Staying in the DROP_PENDING phase
    // setting isWaiting for false

    const dropPending: DropPendingState = {
      // appeasing flow
      phase: 'DROP_PENDING',
      ...draggingState,
      // eslint-disable-next-line
      phase: 'DROP_PENDING',
      // No longer waiting
      reason: state.reason,
      isWaiting: false,
    };

    return dropPending;

    // critical dimensions are being replaced

    // const dimensions: DimensionMap = (() => {
    //   // flow is getting confused
    //   invariant(state.phase === 'BULK_COLLECTING');

    //   // new dimensions contain the critical dimensions - we can just use those
    //   if (suppliedCritical) {
    //     return suppliedDimensions;
    //   }

    //   // need to maintain critical dimensions as they where not collected
    //   const draggable: DraggableDimension =
    //     state.dimensions.draggables[state.critical.draggable.id];
    //   const droppable: DroppableDimension =
    //     state.dimensions.droppables[state.critical.droppable.id];

    //   return {
    //     draggables: {
    //       ...suppliedDimensions.draggables,
    //       [draggable.descriptor.id]: draggable,
    //     },
    //     droppables: {
    //       ...suppliedDimensions.droppables,
    //       [droppable.descriptor.id]: droppable,
    //     },
    //   };
    // })();

    // // TODO: ensure viewport is reset after bulk collection
    // // The starting index of a draggable can change during a drag
    // const critical: Critical = suppliedCritical || state.critical;

    // // this will get the impact
    // const impact: DragImpact = getDragImpact({
    //   pageBorderBoxCenter: state.current.page.borderBoxCenter,
    //   draggable: dimensions.draggables[critical.draggable.id],
    //   draggables: dimensions.draggables,
    //   droppables: dimensions.droppables,
    //   previousImpact: getHomeImpact(critical, dimensions.droppables),
    //   viewport,
    // });

    // const positions = (() => {
    //   invariant(state.phase === 'BULK_COLLECTING');

    //   if (!suppliedCritical) {
    //     return {
    //       initial: state.initial,
    //       current: state.current,
    //     };
    //   }

    //   const draggable: DraggableDimension = dimensions.draggables[critical.draggable.id];
    //   const newCenter: Position = draggable.client.borderBox.center;
    //   const oldCenter: Position = state.initial.client.borderBoxCenter;
    //   const diff: Position = subtract(newCenter, oldCenter);
    //   console.log('DIFF', diff);

    //   const initial: DragPositions = (() => {
    //     invariant(state.phase === 'BULK_COLLECTING');

    //     const oldInitialClient: ItemPositions = state.initial.client;
    //     const scroll: Position = viewport.scroll.initial;
    //     const client: ItemPositions = {
    //       // TODO: add!?
    //       selection: add(oldInitialClient.selection, diff),
    //       borderBoxCenter: newCenter,
    //       offset: origin,
    //     };
    //     const page: ItemPositions = {
    //       selection: add(client.selection, scroll),
    //       offset: add(client.offset, scroll),
    //       borderBoxCenter: add(client.borderBoxCenter, scroll),
    //     };
    //     return {
    //       client, page,
    //     };
    //   })();

    //   const current: DragPositions = (() => {
    //     invariant(state.phase === 'BULK_COLLECTING');

    //     const oldCurrentClient: ItemPositions = state.current.client;
    //     const scroll: Position = viewport.scroll.current;
    //     const client: ItemPositions = {
    //       selection: subtract(oldCurrentClient.selection, diff),
    //       borderBoxCenter: subtract(oldCurrentClient.borderBoxCenter, diff),
    //       offset: subtract(oldCurrentClient.offset, diff),
    //     };
    //     const page: ItemPositions = {
    //       selection: add(client.selection, scroll),
    //       offset: add(client.offset, scroll),
    //       borderBoxCenter: add(client.borderBoxCenter, scroll),
    //     };
    //     return {
    //       client, page,
    //     };
    //   })();

    //   return { initial, current };
    // })();

    // // Moving into the DRAGGING phase
    // if (state.phase === 'BULK_COLLECTING') {
    //   return {
    //     // appeasing flow
    //     phase: 'DRAGGING',
    //     ...state,
    //     // eslint-disable-next-line
    //     phase: 'DRAGGING',
    //     critical,
    //     impact,
    //     initial: positions.initial,
    //     current: positions.current,
    //     dimensions,
    //     viewport,
    //   };
    // }

    // // There was a DROP_PENDING
    // // Staying in the DROP_PENDING phase
    // // setting isWaiting for false
    // return {
    //   // appeasing flow
    //   phase: 'DROP_PENDING',
    //   ...state,
    //   // eslint-disable-next-line
    //   phase: 'DROP_PENDING',
    //   impact,
    //   dimensions,
    //   critical,
    //   viewport,
    //   // No longer waiting
    //   isWaiting: false,
    // };
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

    invariant(isMovementAllowed(state), `MOVE not permitted in phase ${state.phase}`);

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
    if (state.phase === 'DROP_PENDING' || state.phase === 'BULK_COLLECTING') {
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
    if (state.phase === 'BULK_COLLECTING' || state.phase === 'DROP_PENDING') {
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
