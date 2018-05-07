// @flow
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import type {
  Action,
  State,
  DraggableDimension,
  DroppableDimension,
  DroppableId,
  DraggableId,
  DimensionState,
  DraggableDescriptor,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DragState,
  DropResult,
  CurrentDrag,
  DragImpact,
  InitialDrag,
  PendingDrop,
  Phase,
  DraggableLocation,
  CurrentDragPositions,
  InitialDragPositions,
  LiftRequest,
  Viewport,
} from '../types';
import { add, subtract, isEqual } from './position';
import { noMovement } from './no-impact';
import getDragImpact from './get-drag-impact/';
import moveToNextIndex from './move-to-next-index/';
import type { Result as MoveToNextResult } from './move-to-next-index/move-to-next-index-types';
import type { Result as MoveCrossAxisResult } from './move-cross-axis/move-cross-axis-types';
import moveCrossAxis from './move-cross-axis/';
import { scrollDroppable } from './droppable-dimension';

const noDimensions: DimensionState = {
  request: null,
  draggable: {},
  droppable: {},
};

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

const clean = memoizeOne((phase?: Phase = 'IDLE'): State => ({
  phase,
  drag: null,
  drop: null,
  dimension: noDimensions,
}));

type MoveArgs = {|
  state: State,
  clientSelection: Position,
  shouldAnimate: boolean,
  viewport?: Viewport,
  // force a custom drag impact (optionally provided)
  impact?: ?DragImpact,
  // provide a scroll jump request (optionally provided - and can be null)
  scrollJumpRequest?: ?Position,
|}

const canPublishDimension = (phase: Phase): boolean =>
  ['IDLE', 'DROP_ANIMATING', 'DROP_COMPLETE'].indexOf(phase) === -1;

// TODO: move into own file and write tests
const move = ({
  state,
  clientSelection,
  shouldAnimate,
  viewport: proposedViewport,
  impact,
  scrollJumpRequest,
}: MoveArgs): State => {
  if (state.phase !== 'DRAGGING') {
    console.error('cannot move while not dragging');
    return clean();
  }

  const last: ?DragState = state.drag;

  if (last == null) {
    console.error('cannot move if there is no drag information');
    return clean();
  }

  const previous: CurrentDrag = last.current;
  const initial: InitialDrag = last.initial;
  const viewport: Viewport = proposedViewport || previous.viewport;
  const currentWindowScroll: Position = viewport.scroll;

  const client: CurrentDragPositions = (() => {
    const offset: Position = subtract(clientSelection, initial.client.selection);

    const result: CurrentDragPositions = {
      offset,
      selection: clientSelection,
      borderBoxCenter: add(offset, initial.client.borderBoxCenter),
    };
    return result;
  })();

  const page: CurrentDragPositions = {
    selection: add(client.selection, currentWindowScroll),
    offset: add(client.offset, currentWindowScroll),
    borderBoxCenter: add(client.borderBoxCenter, currentWindowScroll),
  };

  const current: CurrentDrag = {
    client,
    page,
    shouldAnimate,
    viewport,
    isBulkCollecting: previous.isBulkCollecting,
  };

  const newImpact: DragImpact = (() => {
    // Force setting of an impact
    if (impact) {
      return impact;
    }

    // If a bulk collection is occurring - block any impact updatess
    if (current.isBulkCollecting) {
      return last.impact;
    }

    return getDragImpact({
      pageBorderBoxCenter: page.borderBoxCenter,
      draggable: state.dimension.draggable[initial.descriptor.id],
      draggables: state.dimension.draggable,
      droppables: state.dimension.droppable,
      previousImpact: last.impact,
      viewport,
    });
  })();

  const drag: DragState = {
    initial,
    impact: newImpact,
    current,
    scrollJumpRequest,
  };

  return {
    ...state,
    drag,
  };
};

type PublishArgs = {|
  existing: State,
  draggables: DraggableDimension[],
  droppables: DroppableDimension[],
  viewport: Viewport,
  shouldPurge: boolean,
|}

const publish = ({
  existing,
  draggables,
  droppables,
  viewport,
  shouldPurge,
}: PublishArgs): State => {
  // TODO: use throw here?
  invariant(canPublishDimension(existing.phase), `Dimensions rejected as no longer allowing dimension capture in phase ${existing.phase}`);
  invariant(existing.drag, 'Cannot add dimensions when there is no drag state');

  if (!existing.drag.current.isBulkCollecting) {
    console.warn('Bulk collection recieved and was not expecting it');
  }

  const drag: DragState = {
    ...existing.drag,
    current: {
      ...existing.drag.current,
      viewport,
      isBulkCollecting: false,
    },
  };

  const draggableMap: DraggableDimensionMap = {
    ...toDraggableMap(draggables),
    ...(shouldPurge ? null : existing.dimension.draggable),
  };

  const droppableMap: DroppableDimensionMap = {
    ...toDroppableMap(droppables),
    ...(shouldPurge ? null : existing.dimension.droppable),
  };

  const newState: State = {
    ...existing,
    drag,
    dimension: {
      request: existing.dimension.request,
      draggable: draggableMap,
      droppable: droppableMap,
    },
  };

  return newState;
};

const updateStateAfterDimensionChange = (newState: State, impact?: ?DragImpact): State => {
  // not dragging yet
  if (newState.phase === 'COLLECTING_INITIAL_DIMENSIONS') {
    return newState;
  }

  // not calculating movement if not in the DRAGGING phase
  if (newState.phase !== 'DRAGGING') {
    return newState;
  }

  // already dragging - need to recalculate impact
  if (!newState.drag) {
    console.error('cannot update a draggable dimension in an existing drag as there is invalid drag state');
    return clean();
  }

  return move({
    state: newState,
    // use the existing values
    clientSelection: newState.drag.current.client.selection,
    shouldAnimate: newState.drag.current.shouldAnimate,
    impact,
  });
};

export default (state: State = clean('IDLE'), action: Action): State => {
  if (action.type === 'CLEAN') {
    return clean();
  }

  if (action.type === 'PREPARE') {
    return clean('PREPARING');
  }

  if (action.type === 'REQUEST_DIMENSIONS') {
    if (state.phase !== 'PREPARING') {
      console.error('trying to start a lift while not preparing for a lift');
      return clean();
    }

    const request: LiftRequest = action.payload;

    return {
      phase: 'COLLECTING_INITIAL_DIMENSIONS',
      drag: null,
      drop: null,
      dimension: {
        request,
        draggable: {},
        droppable: {},
      },
    };
  }

  if (action.type === 'PUBLISH_DRAGGABLE_DIMENSION') {
    const dimension: DraggableDimension = action.payload;

    if (!canPublishDimension(state.phase)) {
      console.warn('dimensions rejected as no longer allowing dimension capture in phase', state.phase);
      return state;
    }

    const newState: State = {
      ...state,
      dimension: {
        request: state.dimension.request,
        droppable: state.dimension.droppable,
        draggable: {
          ...state.dimension.draggable,
          [dimension.descriptor.id]: dimension,
        },
      },
    };

    return updateStateAfterDimensionChange(newState);
  }

  if (action.type === 'PUBLISH_DROPPABLE_DIMENSION') {
    const dimension: DroppableDimension = action.payload;

    if (!canPublishDimension(state.phase)) {
      console.warn('dimensions rejected as no longer allowing dimension capture in phase', state.phase);
      return state;
    }

    const newState: State = {
      ...state,
      dimension: {
        request: state.dimension.request,
        draggable: state.dimension.draggable,
        droppable: {
          ...state.dimension.droppable,
          [dimension.descriptor.id]: dimension,
        },
      },
    };

    return updateStateAfterDimensionChange(newState);
  }

  if (action.type === 'INITIAL_PUBLISH') {
    const draggable: DraggableDimension = action.payload.draggable;
    const home: DroppableDimension = action.payload.home;
    const viewport: Viewport = action.payload.viewport;

    return publish({
      existing: state,
      draggables: [draggable],
      droppables: [home],
      viewport,
      shouldPurge: true,
    });
  }

  if (action.type === 'BULK_PUBLISH') {
    const draggables: DraggableDimension[] = action.payload.draggables;
    const droppables: DroppableDimension[] = action.payload.droppables;
    const viewport: Viewport = action.viewport;
    const replaceCritical: boolean = action.replaceCritical;

    return publish({
      existing: state,
      draggables: action.payload.draggables,
      droppables: action.payload.dropables,
      viewport: action.viewport,
      replaceCritical: action.replaceCritical,
    });

    if (!canPublishDimension(state.phase)) {
      console.warn('dimensions rejected as no longer allowing dimension capture in phase', state.phase);
      return state;
    }

    const newDraggables: DraggableDimensionMap = draggables.reduce((previous, current) => {
      previous[current.descriptor.id] = current;
      return previous;
    }, {});

    const newDroppables: DroppableDimensionMap = droppables.reduce((previous, current) => {
      previous[current.descriptor.id] = current;
      return previous;
    }, {});

    const drag: ?DragState = (() => {
      const existing: ?DragState = state.drag;
      if (!existing) {
        return null;
      }

      if (existing.current.hasCompletedFirstBulkPublish) {
        return existing;
      }

      const newDrag: DragState = {
        ...existing,
        current: {
          ...existing.current,
          hasCompletedFirstBulkPublish: true,
        },
      };

      return newDrag;
    })();

    const newState: State = {
      ...state,
      drag,
      dimension: {
        request: state.dimension.request,
        draggable: {
          ...state.dimension.draggable,
          ...newDraggables,
        },
        droppable: {
          ...state.dimension.droppable,
          ...newDroppables,
        },
      },
    };

    return updateStateAfterDimensionChange(newState);
  }

  if (action.type === 'COMPLETE_LIFT') {
    if (state.phase !== 'COLLECTING_INITIAL_DIMENSIONS') {
      console.error('trying complete lift without collecting dimensions');
      return state;
    }

    const { id, client, viewport, autoScrollMode } = action.payload;
    const page: InitialDragPositions = {
      selection: add(client.selection, viewport.scroll),
      borderBoxCenter: add(client.borderBoxCenter, viewport.scroll),
    };

    const draggable: ?DraggableDimension = state.dimension.draggable[id];

    if (!draggable) {
      console.error('could not find draggable in store after lift');
      return clean();
    }

    const descriptor: DraggableDescriptor = draggable.descriptor;

    const initial: InitialDrag = {
      descriptor,
      autoScrollMode,
      client,
      page,
      viewport,
    };

    const current: CurrentDrag = {
      client: {
        selection: client.selection,
        borderBoxCenter: client.borderBoxCenter,
        offset: origin,
      },
      page: {
        selection: page.selection,
        borderBoxCenter: page.borderBoxCenter,
        offset: origin,
      },
      viewport,
      hasCompletedFirstBulkPublish: false,
      shouldAnimate: false,
    };

    // Calculate initial impact

    const home: ?DroppableDimension = state.dimension.droppable[descriptor.droppableId];

    if (!home) {
      console.error('Cannot find home dimension for initial lift');
      return clean();
    }

    const destination: DraggableLocation = {
      index: descriptor.index,
      droppableId: descriptor.droppableId,
    };

    const impact: DragImpact = {
      movement: noMovement,
      direction: home.axis.direction,
      destination,
    };

    return {
      ...state,
      phase: 'DRAGGING',
      drag: {
        initial,
        current,
        impact,
        scrollJumpRequest: null,
      },
    };
  }

  if (action.type === 'UPDATE_DROPPABLE_DIMENSION_SCROLL') {
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

  if (action.type === 'MOVE') {
    // Otherwise get an incorrect index calculated before the other dimensions are published
    const { client, viewport, shouldAnimate } = action.payload;
    const drag: ?DragState = state.drag;

    if (!drag) {
      console.error('Cannot move while there is no drag state');
      return state;
    }

    const impact: ?DragImpact = (() => {
      // we do not want to recalculate the initial impact until the first bulk publish is finished
      if (!drag.current.hasCompletedFirstBulkPublish) {
        return drag.impact;
      }

      // If we are jump scrolling - manual movements should not update the impact
      if (drag.initial.autoScrollMode === 'JUMP') {
        return drag.impact;
      }

      return null;
    })();

    return move({
      state,
      clientSelection: client,
      viewport,
      shouldAnimate,
      impact,
    });
  }

  if (action.type === 'MOVE_BY_WINDOW_SCROLL') {
    const { viewport } = action.payload;
    const drag: ?DragState = state.drag;

    if (!drag) {
      console.error('cannot move with window scrolling if no current drag');
      return clean();
    }

    // TODO: need to improve this so that it compares the whole viewport
    if (isEqual(viewport.scroll, drag.current.viewport.scroll)) {
      return state;
    }

    // return state;
    const isJumpScrolling: boolean = drag.initial.autoScrollMode === 'JUMP';

    // If we are jump scrolling - any window scrolls should not update the impact
    const impact: ?DragImpact = isJumpScrolling ? drag.impact : null;

    return move({
      state,
      clientSelection: drag.current.client.selection,
      viewport,
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

    return {
      phase: 'DROP_COMPLETE',
      drag: null,
      drop: {
        pending: null,
        result,
      },
      dimension: noDimensions,
    };
  }

  return state;
};
