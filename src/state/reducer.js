// @flow
import memoizeOne from 'memoize-one';
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
  Position,
  InitialDragPositions,
} from '../types';
import { add, subtract } from './position';
import { noMovement } from './no-impact';
import getDragImpact from './get-drag-impact/';
import moveToNextIndex from './move-to-next-index/';
import type { Result as MoveToNextResult } from './move-to-next-index/move-to-next-index-types';
import type { Result as MoveCrossAxisResult } from './move-cross-axis/move-cross-axis-types';
import moveCrossAxis from './move-cross-axis/';

const noDimensions: DimensionState = {
  request: null,
  draggable: {},
  droppable: {},
};

const origin: Position = { x: 0, y: 0 };

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
  windowScroll ?: Position,
  // force a custom drag impact
  impact?: DragImpact,
|}

const canPublishDimension = (phase: Phase): boolean =>
  ['IDLE', 'DROP_ANIMATING', 'DROP_COMPLETE'].indexOf(phase) === -1;

// TODO: move into own file and write tests
const move = ({
  state,
  clientSelection,
  shouldAnimate,
  windowScroll,
  impact,
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
  const currentWindowScroll: Position = windowScroll || previous.windowScroll;

  const client: CurrentDragPositions = (() => {
    const offset: Position = subtract(clientSelection, initial.client.selection);

    const result: CurrentDragPositions = {
      offset,
      selection: clientSelection,
      center: add(offset, initial.client.center),
    };
    return result;
  })();

  const page: CurrentDragPositions = {
    selection: add(client.selection, currentWindowScroll),
    offset: add(client.offset, currentWindowScroll),
    center: add(client.center, currentWindowScroll),
  };

  const current: CurrentDrag = {
    client,
    page,
    shouldAnimate,
    windowScroll: currentWindowScroll,
  };

  const newImpact: DragImpact = (impact || getDragImpact({
    pageCenter: page.center,
    draggable: state.dimension.draggable[initial.descriptor.id],
    draggables: state.dimension.draggable,
    droppables: state.dimension.droppable,
    previousImpact: last.impact,
  }));

  const drag: DragState = {
    initial,
    impact: newImpact,
    current,
  };

  return {
    ...state,
    drag,
  };
};

const updateStateAfterDimensionChange = (newState: State): State => {
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

    const id: DraggableId = action.payload;

    return {
      phase: 'COLLECTING_INITIAL_DIMENSIONS',
      drag: null,
      drop: null,
      dimension: {
        request: id,
        draggable: {},
        droppable: {},
      },
    };
  }

  if (action.type === 'PUBLISH_DRAGGABLE_DIMENSIONS') {
    const dimensions: DraggableDimension[] = action.payload;

    if (!canPublishDimension(state.phase)) {
      console.warn('dimensions rejected as no longer allowing dimension capture in phase', state.phase);
      return state;
    }

    const additions: DraggableDimensionMap = dimensions.reduce((previous, current) => {
      previous[current.descriptor.id] = current;
      return previous;
    }, {});

    const newState: State = {
      ...state,
      dimension: {
        request: state.dimension.request,
        droppable: state.dimension.droppable,
        draggable: {
          ...state.dimension.draggable,
          ...additions,
        },
      },
    };

    return updateStateAfterDimensionChange(newState);
  }

  if (action.type === 'PUBLISH_DROPPABLE_DIMENSIONS') {
    const dimensions: DroppableDimension[] = action.payload;

    if (!canPublishDimension(state.phase)) {
      console.warn('dimensions rejected as no longer allowing dimension capture in phase', state.phase);
      return state;
    }

    const additions: DroppableDimensionMap = dimensions.reduce((previous, current) => {
      previous[current.descriptor.id] = current;
      return previous;
    }, {});

    const newState: State = {
      ...state,
      dimension: {
        request: state.dimension.request,
        draggable: state.dimension.draggable,
        droppable: {
          ...state.dimension.droppable,
          ...additions,
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

    const { id, client, windowScroll, isScrollAllowed } = action.payload;
    const page: InitialDragPositions = {
      selection: add(client.selection, windowScroll),
      center: add(client.center, windowScroll),
    };

    const draggable: ?DraggableDimension = state.dimension.draggable[id];

    if (!draggable) {
      console.error('could not find draggable in store after lift');
      return clean();
    }

    const descriptor: DraggableDescriptor = draggable.descriptor;

    const initial: InitialDrag = {
      descriptor,
      isScrollAllowed,
      client,
      page,
      windowScroll,
    };

    const current: CurrentDrag = {
      client: {
        selection: client.selection,
        center: client.center,
        offset: origin,
      },
      page: {
        selection: page.selection,
        center: page.center,
        offset: origin,
      },
      windowScroll,
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
      },
    };
  }

  if (action.type === 'UPDATE_DROPPABLE_DIMENSION_SCROLL') {
    if (state.phase !== 'DRAGGING') {
      console.error('cannot update a droppable dimensions scroll when not dragging');
      return clean();
    }

    if (state.drag == null) {
      console.error('invalid store state');
      return clean();
    }

    // Currently not supporting container scrolling while dragging with a keyboard
    // We do not store whether we are dragging with a keyboard in the state but this flag
    // does this trick. Ideally this check would not exist.
    // Kill the drag instantly
    if (!state.drag.initial.isScrollAllowed) {
      return clean();
    }

    const { id, offset } = action.payload;

    const target: ?DroppableDimension = state.dimension.droppable[id];

    if (!target) {
      // eslint-disable-next-line no-console
      console.log('cannot update scroll for droppable as it has not yet been collected');
      return state;
    }

    // TODO: do not break an existing dimension.
    // Rather, have a different structure to store the scroll
    // $ExpectError - flow does not like spread
    const dimension: DroppableDimension = {
      ...target,
      container: {
        ...target.container,
        scroll: {
          ...target.container.scroll,
          current: offset,
        },
      },
    };

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

    return updateStateAfterDimensionChange(newState);
  }

  if (action.type === 'UPDATE_DROPPABLE_DIMENSION_IS_ENABLED') {
    if (!Object.keys(state.dimension.droppable).length) {
      return state;
    }

    const { id, isEnabled } = action.payload;
    const target = state.dimension.droppable[id];

    if (!target) {
      console.error('cannot update enabled flag on droppable that does not have a dimension');
      return clean();
    }

    if (target.isEnabled === isEnabled) {
      console.warn(`trying to set droppable isEnabled to ${String(isEnabled)} but it is already ${String(isEnabled)}`);
      return state;
    }

    const updatedDroppableDimension = {
      ...target,
      isEnabled,
    };

    return {
      ...state,
      dimension: {
        ...state.dimension,
        droppable: {
          ...state.dimension.droppable,
          [id]: updatedDroppableDimension,
        },
      },
    };
  }

  if (action.type === 'MOVE') {
    const { client, windowScroll } = action.payload;
    return move({
      state,
      clientSelection: client,
      windowScroll,
      shouldAnimate: false,
    });
  }

  if (action.type === 'MOVE_BY_WINDOW_SCROLL') {
    const { windowScroll } = action.payload;

    if (!state.drag) {
      console.error('cannot move with window scrolling if no current drag');
      return clean();
    }

    return move({
      state,
      clientSelection: state.drag.current.client.selection,
      windowScroll,
      shouldAnimate: false,
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
      previousImpact: existing.impact,
    });

    // cannot move anyway (at the beginning or end of a list)
    if (!result) {
      return state;
    }

    const impact: DragImpact = result.impact;
    const page: Position = result.pageCenter;
    const client: Position = subtract(page, existing.current.windowScroll);

    return move({
      state,
      impact,
      clientSelection: client,
      shouldAnimate: true,
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
    const center: Position = current.page.center;
    const droppableId: DroppableId = state.drag.impact.destination.droppableId;
    const home: DraggableLocation = {
      index: descriptor.index,
      droppableId: descriptor.droppableId,
    };

    const result: ?MoveCrossAxisResult = moveCrossAxis({
      isMovingForward: action.type === 'CROSS_AXIS_MOVE_FORWARD',
      pageCenter: center,
      draggableId,
      droppableId,
      home,
      draggables: state.dimension.draggable,
      droppables: state.dimension.droppable,
      previousImpact: state.drag.impact,
    });

    if (!result) {
      return state;
    }

    const page: Position = result.pageCenter;
    const client: Position = subtract(page, current.windowScroll);

    return move({
      state,
      clientSelection: client,
      impact: result.impact,
      shouldAnimate: true,
    });
  }

  if (action.type === 'DROP_ANIMATE') {
    const { trigger, newHomeOffset, impact, result } = action.payload;

    if (state.phase !== 'DRAGGING') {
      console.error('cannot animate drop while not dragging', action);
      return state;
    }

    if (!state.drag) {
      console.error('cannot animate drop - invalid drag state');
      return clean();
    }

    const pending: PendingDrop = {
      trigger,
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
