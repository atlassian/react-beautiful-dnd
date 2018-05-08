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
  DropResult,
  DraggableLocation,
  LiftRequest,
  Viewport,
  IdleState,
  PreparingState,
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

const origin: Position = { x: 0, y: 0 };

const toDraggableMap = (draggables: DraggableDimension[]): DraggableDimensionMap =>
  draggables.reduce((previous: DraggableDimensionMap, current: DraggableDimension) => {
    previous[current.descriptor.id] = current;
    return previous;
  }, {});

const toDroppableMap = (droppables: DroppableDimension[]): DroppableDimensionMap =>
  droppables.reduce((previous: DroppableDimensionMap, current: DroppableDimension) => {
    previous[current.descriptor.id] = current;
    return previous;
  }, {});

const clean = (): IdleState => ({ phase: 'IDLE' });

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

const move = ({
  state,
  clientSelection,
  shouldAnimate,
  windowDetails,
  impact,
  scrollJumpRequest,
}: MoveArgs): BulkCollectionState | DraggingState => {
  // BULK_COLLECTING: can update position but cannot update impact
  // DRAGGING: can update position and impact

  invariant(state.phase === 'BULK_COLLECTING' || state.phase === 'DRAGGING',
    `Attempting to move in an unsupported phase ${state.phase}`);

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

export default (state: State = clean(), action: Action): State => {
  if (action.type === 'CLEAN') {
    return clean();
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

    const result: BulkCollectionState = {
      // We are now waiting for the first bulk collection.
      phase: 'BULK_COLLECTING',
      critical,
      autoScrollMode,
      dimensions,
      initial,
      current: initial,
      impact: noImpact,
      window: windowDetails,
      scrollJumpRequest: null,
      shouldAnimate: false,
    };

    return result;
  }

  if (action.type === 'BULK_REPLACE') {
    // Unexpected bulk publish
    invariant(state.phase === 'BULK_COLLECTING' || state.phase === 'DROP_PENDING',
      `Unexpected bulk publish received in phase ${state.phase}`);

    // A drop is waiting on a bulk publish to finish
    // The pending drop will be handled by the dropMiddleware
    // if (state.phase === 'DROP_PENDING') {
    //   return state;
    // }

    const existing: BulkCollectionState | DropPendingState = state;

    const { viewport, shouldReplaceCritical, dimensions: proposed } = action.payload;
    const dimensions: DimensionMap = (() => {
      if (shouldReplaceCritical) {
        return proposed;
      }

      // need to maintain critical dimensions
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

    // We are now moving out of the BULK_PUBLISH phase into DRAGGING
    const newState: State = {
      phase: 'DRAGGING',
      ...state,
      // eslint-disable-next-line
      phase: 'DRAGGING',
      impact,
      dimensions,
      window: windowDetails,
    };

    return newState;
  }

  if (action.type === 'MOVE') {
    // Still preparing - ignore for now
    if (state.phase === 'PREPARING') {
      return state;
    }

    const { client, shouldAnimate } = action.payload;

    return move({
      state,
      clientSelection: client,
      shouldAnimate,
    });
  }

  if (action.type === 'UPDATE_DROPPABLE_SCROLL') {
    if (state.phase !== 'DRAGGING') {
      console.error('cannot update a droppable dimensions scroll when not dragging');
      return clean();
    }

    const drag: ?DragState = state.drag;

    if (drag == null) {
      console.error('invalid store state');
      return clean();
    }

    const { id, offset } = action.payload;

    const target: ?DroppableDimension = state.dimension.droppable[id];

    if (!target) {
      console.warn('cannot update scroll for droppable as it has not yet been collected');
      return state;
    }

    const dimension: DroppableDimension = scrollDroppable(target, offset);

    // If we are jump scrolling - dimension changes should not update the impact
    const impact: ?DragImpact = drag.initial.autoScrollMode === 'JUMP' ?
      drag.impact : null;

    const newState: State = {
      ...state,
      dimension: {
        request: state.dimension.request,
        draggable: state.dimension.draggable,
        droppable: {
          ...state.dimension.droppable,
          [id]: dimension,
        },
      },
    };

    return updateStateAfterDimensionChange(newState, impact);
  }

  if (action.type === 'UPDATE_DROPPABLE_DIMENSION_IS_ENABLED') {
    if (!Object.keys(state.dimension.droppable).length) {
      return state;
    }

    const { id, isEnabled } = action.payload;
    const target = state.dimension.droppable[id];

    // This can happen if the enabled state changes on the droppable between
    // a onDragStart and the initial publishing of the Droppable.
    // The isEnabled state will be correctly populated when the Droppable dimension
    // is published. Therefore we do not need to log any error here
    if (!target) {
      return state;
    }

    if (target.isEnabled === isEnabled) {
      console.warn(`Trying to set droppable isEnabled to ${String(isEnabled)} but it is already ${String(isEnabled)}`);
      return state;
    }

    const updatedDroppableDimension = {
      ...target,
      isEnabled,
    };

    const result: State = {
      ...state,
      dimension: {
        ...state.dimension,
        droppable: {
          ...state.dimension.droppable,
          [id]: updatedDroppableDimension,
        },
      },
    };

    return updateStateAfterDimensionChange(result);
  }

  if (action.type === 'MOVE_BY_WINDOW_SCROLL') {
    invariant(state.phase === 'DRAGGING' || state.phase === 'BULK_COLLECTING',
      `Cannot move by window in phase ${state.phase}`);

    const viewport: Viewport = action.payload.viewport;

    if (isEqual(state.window.scroll.current, viewport.scroll)) {
      return state;
    }

    // return state;
    const isJumpScrolling: boolean = state.autoScrollMode === 'JUMP';

    // If we are jump scrolling - any window scrolls should not update the impact
    const impact: ?DragImpact = isJumpScrolling ? state.impact : null;

    const diff: Position = subtract(viewport.scroll, state.window.scroll.initial);
    const displacement: Position = negate(diff);

    const windowDetails: WindowDetails = {
      viewport,
      scroll: {
        initial: state.window.scroll.initial,
        current: viewport.scroll,
        diff: {
          value: diff,
          displacement,
        },
      },
    };

    return move({
      state,
      clientSelection: state.current.client.selection,
      windowDetails,
      shouldAnimate: false,
      impact,
    });
  }

  if (action.type === 'MOVE_FORWARD' || action.type === 'MOVE_BACKWARD') {
    if (state.phase !== 'DRAGGING') {
      console.error('cannot move while not dragging', action);
      return clean();
    }

    if (!state.drag) {
      console.error('cannot move if there is no drag information');
      return clean();
    }

    const existing: DragState = state.drag;
    const isMovingForward: boolean = action.type === 'MOVE_FORWARD';

    if (!existing.impact.destination) {
      console.error('cannot move if there is no previous destination');
      return clean();
    }

    const droppable: DroppableDimension = state.dimension.droppable[
      existing.impact.destination.droppableId
    ];

    const result: ?MoveToNextResult = moveToNextIndex({
      isMovingForward,
      draggableId: existing.initial.descriptor.id,
      droppable,
      draggables: state.dimension.draggable,
      previousPageBorderBoxCenter: existing.current.page.borderBoxCenter,
      previousImpact: existing.impact,
      viewport: existing.current.viewport,
    });

    // cannot move anyway (at the beginning or end of a list)
    if (!result) {
      return state;
    }

    const impact: DragImpact = result.impact;
    const pageBorderBoxCenter: Position = result.pageBorderBoxCenter;
    const clientBorderBoxCenter: Position = subtract(
      pageBorderBoxCenter, existing.current.viewport.scroll
    );

    return move({
      state,
      impact,
      clientSelection: clientBorderBoxCenter,
      shouldAnimate: true,
      scrollJumpRequest: result.scrollJumpRequest,
    });
  }

  if (action.type === 'CROSS_AXIS_MOVE_FORWARD' || action.type === 'CROSS_AXIS_MOVE_BACKWARD') {
    if (state.phase !== 'DRAGGING') {
      console.error('cannot move cross axis when not dragging');
      return clean();
    }

    if (!state.drag) {
      console.error('cannot move cross axis if there is no drag information');
      return clean();
    }

    if (!state.drag.impact.destination) {
      console.error('cannot move cross axis if not in a droppable');
      return clean();
    }

    const current: CurrentDrag = state.drag.current;
    const descriptor: DraggableDescriptor = state.drag.initial.descriptor;
    const draggableId: DraggableId = descriptor.id;
    const pageBorderBoxCenter: Position = current.page.borderBoxCenter;
    const droppableId: DroppableId = state.drag.impact.destination.droppableId;
    const home: DraggableLocation = {
      index: descriptor.index,
      droppableId: descriptor.droppableId,
    };

    const result: ?MoveCrossAxisResult = moveCrossAxis({
      isMovingForward: action.type === 'CROSS_AXIS_MOVE_FORWARD',
      pageBorderBoxCenter,
      draggableId,
      droppableId,
      home,
      draggables: state.dimension.draggable,
      droppables: state.dimension.droppable,
      previousImpact: state.drag.impact,
      viewport: current.viewport,
    });

    if (!result) {
      return state;
    }

    const page: Position = result.pageBorderBoxCenter;
    const client: Position = subtract(page, current.viewport.scroll);

    return move({
      state,
      clientSelection: client,
      impact: result.impact,
      shouldAnimate: true,
    });
  }

  if (action.type === 'DROP_ANIMATE') {
    const { newHomeOffset, impact, result } = action.payload;

    if (state.phase !== 'DRAGGING') {
      console.error('cannot animate drop while not dragging', action);
      return state;
    }

    if (!state.drag) {
      console.error('cannot animate drop - invalid drag state');
      return clean();
    }

    const pending: PendingDrop = {
      newHomeOffset,
      result,
      impact,
    };

    return {
      phase: 'DROP_ANIMATING',
      drag: null,
      drop: {
        pending,
        result: null,
      },
      dimension: state.dimension,
    };
  }

  if (action.type === 'DROP_COMPLETE') {
    const result: DropResult = action.payload;
    const newState: DropCompleteState = {
      phase: 'DROP_COMPLETE',
      result,
    };
    return newState;
  }

  return state;
};
