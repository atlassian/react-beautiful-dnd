// @flow
import middleware from '../../../src/state/hook-middleware';
import { getDraggableDimension, getDroppableDimension } from '../../../src/state/dimension';
import { clean } from '../../../src/state/action-creators';
import getClientRect from '../../../src/state/get-client-rect';
import noImpact from '../../../src/state/no-impact';
import type {
  DraggableId,
  DroppableId,
  DropResult,
  TypeId,
  DragState,
  Hooks,
  Position,
  State,
  InitialDragLocation,
  CurrentDragLocation,
  DraggableDimension,
  DroppableDimension,
  DimensionState,
  DraggableLocation,
  DragStart,
  Store,
} from '../../../src/types';

const execute = (hooks: Hooks, current: State, previous: State) => {
  const stateMock = jest.fn();
  stateMock.mockReturnValueOnce(previous)
    .mockReturnValueOnce(current);
  // force casting to Store type
  const store: Store = ({
    getState: stateMock,
  }: any);
  const next = x => x;
  // does not matter what this is - but using clean to get correct typing
  const action = clean();

  middleware(hooks)(store)(next)(action);
};

const origin: Position = { x: 0, y: 0 };
const draggableId: DraggableId = 'drag-1';
const droppableId: DroppableId = 'drop-1';
const typeId: TypeId = 'TYPE';

const noDimensions: DimensionState = {
  request: null,
  draggable: {},
  droppable: {},
};

const state = (() => {
  const idle: State = {
    phase: 'IDLE',
    drag: null,
    drop: null,
    dimension: noDimensions,
  };

  const collecting: State = {
    phase: 'COLLECTING_DIMENSIONS',
    drag: null,
    drop: null,
    dimension: {
      request: typeId,
      draggable: {},
      droppable: {},
    },
  };

  const source: DraggableLocation = {
    droppableId,
    index: 0,
  };

  const draggableDimension: DraggableDimension = getDraggableDimension({
    id: draggableId,
    droppableId,
    clientRect: getClientRect({
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
    }),
  });
  const droppableDimension: DroppableDimension = getDroppableDimension({
    id: droppableId,
    clientRect: getClientRect({
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
    }),
  });

  const initialClient: InitialDragLocation = {
    selection: { x: 10, y: 10 },
    center: { x: 50, y: 50 },
  };

  const currentClient: CurrentDragLocation = {
    selection: initialClient.selection,
    center: initialClient.center,
    offset: { x: 0, y: 0 },
  };

  const drag: DragState = {
    initial: {
      source,
      client: initialClient,
      page: initialClient,
      windowScroll: origin,
    },
    current: {
      id: draggableId,
      type: typeId,
      client: currentClient,
      page: currentClient,
      windowScroll: origin,
      shouldAnimate: true,
      isScrollAllowed: true,
    },
    impact: noImpact,
  };

  const dragging: State = {
    phase: 'DRAGGING',
    drag,
    drop: null,
    dimension: {
      request: 'TYPE',
      draggable: {
        [draggableId]: draggableDimension,
      },
      droppable: {
        [droppableId]: droppableDimension,
      },
    },
  };

  const result: DropResult = {
    draggableId,
    source,
    type: typeId,
    destination: null,
  };

  const dropAnimating: State = {
    phase: 'DROP_ANIMATING',
    drag: null,
    drop: {
      pending: {
        trigger: 'DROP',
        newHomeOffset: { x: 100, y: 100 },
        impact: noImpact,
        result,
      },
      result: null,
    },
    dimension: noDimensions,
  };

  const cancelAnimating: State = {
    phase: 'DROP_ANIMATING',
    drag: null,
    drop: {
      pending: {
        trigger: 'CANCEL',
        newHomeOffset: { x: 100, y: 100 },
        impact: noImpact,
        result,
      },
      result: null,
    },
    dimension: noDimensions,
  };

  const complete: State = {
    phase: 'DROP_COMPLETE',
    drag: null,
    drop: {
      pending: null,
      result,
    },
    dimension: noDimensions,
  };

  return { idle, collecting, dragging, dropAnimating, cancelAnimating, complete };
})();

describe('Hook middleware', () => {
  let hooks: Hooks;

  beforeEach(() => {
    hooks = {
      onDragStart: jest.fn(),
      onDragEnd: jest.fn(),
    };
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('drag start', () => {
    it('should call the onDragStart hook when a drag starts', () => {
      execute(hooks, state.dragging, state.collecting);
      const expected: DragStart = {
        draggableId,
        type: typeId,
        source: {
          droppableId,
          index: 0,
        },
      };

      expect(hooks.onDragStart).toHaveBeenCalledWith(expected);
    });

    it('should do nothing if no onDragStart is not provided', () => {
      const customHooks: Hooks = {
        onDragEnd: jest.fn(),
      };

      execute(customHooks, state.dragging, state.collecting);

      expect(console.error).not.toHaveBeenCalled();
    });

    it('should log an error and not call the callback if there is no current drag', () => {
      const invalid: State = {
        ...state.dragging,
        drag: null,
      };

      execute(hooks, invalid, state.collecting);

      expect(console.error).toHaveBeenCalled();
    });

    it('should not call if only collecting dimensions (not dragging yet)', () => {
      execute(hooks, state.idle, state.collecting);

      expect(hooks.onDragStart).not.toHaveBeenCalled();
    });
  });

  describe('drag end', () => {
    // it is possible to complete a drag from a DRAGGING or DROP_ANIMATING (drop or cancel)
    const preEndStates: State[] = [state.dragging, state.dropAnimating, state.cancelAnimating];

    preEndStates.forEach((previous: State): void => {
      it('should call onDragEnd with the drop result', () => {
        execute(hooks, state.complete, previous);

        if (!state.complete.drop || !state.complete.drop.result) {
          throw new Error('invalid state');
        }

        const result: DropResult = state.complete.drop.result;

        expect(hooks.onDragEnd).toHaveBeenCalledWith(result);
      });

      it('should log an error and not call the callback if there is no drop result', () => {
        const invalid: State = {
          phase: 'DROP_COMPLETE',
          drop: null,
          drag: null,
          dimension: noDimensions,
        };

        execute(hooks, invalid, previous);

        expect(hooks.onDragEnd).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
      });

      it('should call onDragEnd with null as the destination if there is no destination', () => {
        const result: DropResult = {
          draggableId,
          type: typeId,
          source: {
            droppableId,
            index: 0,
          },
          destination: null,
        };
        const custom: State = {
          phase: 'DROP_COMPLETE',
          drop: {
            pending: null,
            result,
          },
          drag: null,
          dimension: noDimensions,
        };

        execute(hooks, custom, previous);

        expect(hooks.onDragEnd).toHaveBeenCalledWith(result);
      });

      it('should call onDragEnd with null if the item did not move', () => {
        const location: DraggableLocation = {
          droppableId,
          index: 0,
        };
        const result: DropResult = {
          draggableId,
          type: typeId,
          source: location,
          destination: location,
        };
        const custom: State = {
          phase: 'DROP_COMPLETE',
          drop: {
            pending: null,
            result,
          },
          drag: null,
          dimension: noDimensions,
        };
        const expected : DropResult = {
          draggableId: result.draggableId,
          type: result.type,
          source: result.source,
          // destination has been cleared
          destination: null,
        };

        execute(hooks, custom, previous);

        expect(hooks.onDragEnd).toHaveBeenCalledWith(expected);
      });
    });
  });

  describe('drag cleared', () => {
    describe('cleared while dragging', () => {
      it('should return a result with a null destination', () => {
        const expected: DropResult = {
          draggableId,
          type: typeId,
          // $ExpectError - not checking for null
          source: state.dragging.drag.initial.source,
          destination: null,
        };

        execute(hooks, state.idle, state.dragging);

        expect(hooks.onDragEnd).toHaveBeenCalledWith(expected);
      });

      it('should log an error and do nothing if it cannot find a previous drag to publish', () => {
        const invalid: State = {
          phase: 'DRAGGING',
          drag: null,
          drop: null,
          dimension: noDimensions,
        };

        execute(hooks, state.idle, invalid);

        expect(hooks.onDragEnd).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
      });
    });

    // this should never really happen - but just being safe
    describe('cleared while drop animating', () => {
      it('should return a result with a null destination', () => {
        const expected: DropResult = {
          draggableId,
          type: typeId,
          // $ExpectError - not checking for null
          source: state.dropAnimating.drop.pending.result.source,
          destination: null,
        };

        execute(hooks, state.idle, state.dropAnimating);

        expect(hooks.onDragEnd).toHaveBeenCalledWith(expected);
      });

      it('should log an error and do nothing if it cannot find a previous drag to publish', () => {
        const invalid: State = {
          phase: 'DROP_ANIMATING',
          drag: null,
          drop: null,
          dimension: noDimensions,
        };

        execute(hooks, state.idle, invalid);

        expect(hooks.onDragEnd).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
      });
    });
  });
});
