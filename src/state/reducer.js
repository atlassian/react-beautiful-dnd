// @flow
import memoizeOne from 'memoize-one';
import type { TypeId,
  Action,
  State,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableId,
  DraggableId,
  DimensionState,
  DragImpact,
  DragState,
  DropResult,
  CurrentDrag,
  InitialDrag,
  PendingDrop,
  Phase,
  DraggableLocation,
  CurrentDragLocation,
  Position,
  InitialDragLocation,
} from '../types';
import getInitialImpact from './get-initial-impact';
import { add, subtract } from './position';
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

const clean = memoizeOne((phase: ?Phase): State => {
  const state: State = {
    // flow was not good with having a default arg on an optional type
    phase: phase || 'IDLE',
    drag: null,
    drop: null,
    dimension: noDimensions,
  };

  return state;
});

type MoveArgs = {|
  state: State,
  clientSelection: Position,
  shouldAnimate?: boolean,
  windowScroll ?: Position,
  // force a custom drag impact
  impact?: DragImpact,
|}

// TODO: move into own file and write tests
const move = ({
  state,
  clientSelection,
  shouldAnimate = false,
  windowScroll,
  impact,
}: MoveArgs): State => {
  if (state.phase !== 'DRAGGING') {
    console.error('cannot move while not dragging');
    return clean();
  }

  if (state.drag == null) {
    console.error('cannot move if there is no drag information');
    return clean();
  }

  const previous: CurrentDrag = state.drag.current;
  const initial: InitialDrag = state.drag.initial;
  const currentWindowScroll: Position = windowScroll || previous.windowScroll;

  const client: CurrentDragLocation = (() => {
    const offset: Position = subtract(clientSelection, initial.client.selection);

    const result: CurrentDragLocation = {
      offset,
      selection: clientSelection,
      center: add(offset, initial.client.center),
    };
    return result;
  })();

  const page: CurrentDragLocation = {
    selection: add(client.selection, currentWindowScroll),
    offset: add(client.offset, currentWindowScroll),
    center: add(client.center, currentWindowScroll),
  };

  const current: CurrentDrag = {
    id: previous.id,
    type: previous.type,
    isScrollAllowed: previous.isScrollAllowed,
    client,
    page,
    shouldAnimate,
    windowScroll: currentWindowScroll,
  };

  const newImpact: DragImpact = (impact || getDragImpact({
    pageCenter: page.center,
    draggable: state.dimension.draggable[current.id],
    draggables: state.dimension.draggable,
    droppables: state.dimension.droppable,
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

export default (state: State = clean('IDLE'), action: Action): State => {
  if (action.type === 'BEGIN_LIFT') {
    if (state.phase !== 'IDLE') {
      console.error('trying to start a lift while another is occurring');
      return state;
    }
    return clean('COLLECTING_DIMENSIONS');
  }

  if (action.type === 'REQUEST_DIMENSIONS') {
    if (state.phase !== 'COLLECTING_DIMENSIONS') {
      console.error('trying to collect dimensions at the wrong time');
      return state;
    }

    const typeId: TypeId = action.payload;

    return {
      phase: 'COLLECTING_DIMENSIONS',
      drag: null,
      drop: null,
      dimension: {
        request: typeId,
        draggable: {},
        droppable: {},
      },
    };
  }

  if (action.type === 'PUBLISH_DRAGGABLE_DIMENSION') {
    const dimension: DraggableDimension = action.payload;

    if (state.phase !== 'COLLECTING_DIMENSIONS') {
      console.warn('dimension rejected as no longer requesting dimensions', dimension);
      return state;
    }

    if (state.dimension.draggable[dimension.id]) {
      console.error(`dimension already exists for ${dimension.id}`);
      return state;
    }

    return {
      ...state,
      dimension: {
        request: state.dimension.request,
        droppable: state.dimension.droppable,
        draggable: {
          ...state.dimension.draggable,
          [dimension.id]: dimension,
        },
      },
    };
  }

  if (action.type === 'PUBLISH_DROPPABLE_DIMENSION') {
    const dimension: DroppableDimension = action.payload;

    if (state.phase !== 'COLLECTING_DIMENSIONS') {
      console.warn('dimension rejected as no longer requesting dimensions', dimension);
      return state;
    }

    if (state.dimension.droppable[dimension.id]) {
      console.error(`dimension already exists for ${dimension.id}`);
      return state;
    }

    return {
      ...state,
      dimension: {
        request: state.dimension.request,
        draggable: state.dimension.draggable,
        droppable: {
          ...state.dimension.droppable,
          [dimension.id]: dimension,
        },
      },
    };
  }

  if (action.type === 'COMPLETE_LIFT') {
    if (state.phase !== 'COLLECTING_DIMENSIONS') {
      console.error('trying complete lift without collecting dimensions');
      return state;
    }

    const { id, type, client, windowScroll, isScrollAllowed } = action.payload;
    const draggables: DraggableDimensionMap = state.dimension.draggable;
    const draggable: DraggableDimension = state.dimension.draggable[id];
    const droppable: DroppableDimension = state.dimension.droppable[draggable.droppableId];
    const page: InitialDragLocation = {
      selection: add(client.selection, windowScroll),
      center: add(client.center, windowScroll),
    };

    const impact: ?DragImpact = getInitialImpact({
      draggable,
      droppable,
      draggables,
    });

    if (!impact || !impact.destination) {
      console.error('invalid lift state');
      return clean();
    }

    const source: DraggableLocation = impact.destination;

    const initial: InitialDrag = {
      source,
      client,
      page,
      windowScroll,
    };

    const current: CurrentDrag = {
      id,
      type,
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
      isScrollAllowed,
      shouldAnimate: false,
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
    if (!state.drag.current.isScrollAllowed) {
      return clean();
    }

    const { id, offset } = action.payload;

    const target: ?DroppableDimension = state.dimension.droppable[id];

    if (!target) {
      console.error('cannot update a droppable that is not inside of the state', id);
      return clean();
    }

    // TODO: do not break an existing dimension.
    // Rather, have a different structure to store the scroll
    // $ExpectError - flow does not like spread
    const dimension: DroppableDimension = {
      ...target,
      scroll: {
        initial: target.scroll.initial,
        current: offset,
      },
    };

    const withUpdatedDimension: State = {
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

    return move({
      state: withUpdatedDimension,
      clientSelection: state.drag.current.client.selection,
    });
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
      console.warn(`trying to set droppable isEnabled to ${isEnabled} but it is already ${isEnabled}`);
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
      draggableId: existing.current.id,
      impact: existing.impact,
      droppable,
      draggables: state.dimension.draggable,
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
    const draggableId: DraggableId = current.id;
    const center: Position = current.page.center;
    const droppableId: DroppableId = state.drag.impact.destination.droppableId;
    const home: DraggableLocation = state.drag.initial.source;

    const result: ?MoveCrossAxisResult = moveCrossAxis({
      isMovingForward: action.type === 'CROSS_AXIS_MOVE_FORWARD',
      pageCenter: center,
      draggableId,
      droppableId,
      home,
      draggables: state.dimension.draggable,
      droppables: state.dimension.droppable,
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

  if (action.type === 'CLEAN') {
    return clean();
  }

  return state;
};
