// @flow
import fireHooks from '../../../src/state/fire-hooks';
import * as state from '../../utils/simple-state-preset';
import { getPreset } from '../../utils/dimension';
import type {
  DropResult,
  Hooks,
  State,
  DimensionState,
  DraggableLocation,
  DragStart,
} from '../../../src/types';
import * as logger from '../../../src/log';

const preset = getPreset();

const noDimensions: DimensionState = {
  request: null,
  draggable: {},
  droppable: {},
};

describe('fire hooks', () => {
  let hooks: Hooks;
  let loggerError;

  beforeEach(() => {
    loggerError = jest.spyOn(logger, 'error').mockImplementation(() => { });
    hooks = {
      onDragStart: jest.fn(),
      onDragEnd: jest.fn(),
    };
  });

  afterEach(() => {
    loggerError.mockRestore();
  });

  describe('drag start', () => {
    it('should call the onDragStart hook when a drag starts', () => {
      fireHooks(hooks, state.requesting(), state.dragging());
      const expected: DragStart = {
        draggableId: preset.inHome1.descriptor.id,
        type: preset.home.descriptor.type,
        source: {
          droppableId: preset.inHome1.descriptor.droppableId,
          index: preset.inHome1.descriptor.index,
        },
      };

      expect(hooks.onDragStart).toHaveBeenCalledWith(expected);
    });

    it('should do nothing if no onDragStart is not provided', () => {
      const customHooks: Hooks = {
        onDragEnd: jest.fn(),
      };

      fireHooks(customHooks, state.requesting(), state.dragging());

      expect(loggerError).not.toHaveBeenCalled();
    });

    it('should log an error and not call the callback if there is no current drag', () => {
      const invalid: State = {
        ...state.dragging(),
        drag: null,
      };

      fireHooks(hooks, state.requesting(), invalid);

      expect(loggerError).toHaveBeenCalled();
    });

    it('should not call if only collecting dimensions (not dragging yet)', () => {
      fireHooks(hooks, state.idle, state.preparing);
      fireHooks(hooks, state.preparing, state.requesting());

      expect(hooks.onDragStart).not.toHaveBeenCalled();
    });
  });

  describe('drag end', () => {
    // it is possible to complete a drag from a DRAGGING or DROP_ANIMATING (drop or cancel)
    const preEndStates: State[] = [
      state.dragging(),
      state.dropAnimating(),
      state.userCancel(),
    ];

    preEndStates.forEach((previous: State): void => {
      it('should call onDragEnd with the drop result', () => {
        const result: DropResult = {
          draggableId: preset.inHome1.descriptor.id,
          type: preset.home.descriptor.type,
          source: {
            droppableId: preset.inHome1.descriptor.droppableId,
            index: preset.inHome1.descriptor.index,
          },
          destination: {
            droppableId: preset.inHome1.descriptor.droppableId,
            index: preset.inHome1.descriptor.index + 1,
          },
        };
        const current: State = {
          phase: 'DROP_COMPLETE',
          drop: {
            pending: null,
            result,
          },
          drag: null,
          dimension: noDimensions,
        };

        fireHooks(hooks, previous, current);

        if (!current.drop || !current.drop.result) {
          throw new Error('invalid state');
        }

        const provided: DropResult = current.drop.result;
        expect(hooks.onDragEnd).toHaveBeenCalledWith(provided);
      });

      it('should log an error and not call the callback if there is no drop result', () => {
        const invalid: State = {
          ...state.dropComplete(),
          drop: null,
        };

        fireHooks(hooks, previous, invalid);

        expect(hooks.onDragEnd).not.toHaveBeenCalled();
        expect(loggerError).toHaveBeenCalled();
      });

      it('should call onDragEnd with null as the destination if there is no destination', () => {
        const result: DropResult = {
          draggableId: preset.inHome1.descriptor.id,
          type: preset.home.descriptor.type,
          source: {
            droppableId: preset.inHome1.descriptor.droppableId,
            index: preset.inHome1.descriptor.index,
          },
          destination: null,
        };
        const current: State = {
          phase: 'DROP_COMPLETE',
          drop: {
            pending: null,
            result,
          },
          drag: null,
          dimension: noDimensions,
        };

        fireHooks(hooks, previous, current);

        expect(hooks.onDragEnd).toHaveBeenCalledWith(result);
      });

      it('should call onDragEnd with null if the item did not move', () => {
        const source: DraggableLocation = {
          droppableId: preset.inHome1.descriptor.droppableId,
          index: preset.inHome1.descriptor.index,
        };
        const result: DropResult = {
          draggableId: preset.inHome1.descriptor.id,
          type: preset.home.descriptor.type,
          source,
          destination: source,
        };
        const current: State = {
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

        fireHooks(hooks, previous, current);

        expect(hooks.onDragEnd).toHaveBeenCalledWith(expected);
      });
    });
  });

  describe('drag cleared', () => {
    describe('cleared while dragging', () => {
      it('should return a result with a null destination', () => {
        const expected: DropResult = {
          draggableId: preset.inHome1.descriptor.id,
          type: preset.home.descriptor.type,
          // $ExpectError - not checking for null
          source: {
            index: preset.inHome1.descriptor.index,
            droppableId: preset.inHome1.descriptor.droppableId,
          },
          destination: null,
        };

        fireHooks(hooks, state.dragging(), state.idle);

        expect(hooks.onDragEnd).toHaveBeenCalledWith(expected);
      });

      it('should log an error and do nothing if it cannot find a previous drag to publish', () => {
        const invalid: State = {
          phase: 'DRAGGING',
          drag: null,
          drop: null,
          dimension: noDimensions,
        };

        fireHooks(hooks, state.idle, invalid);

        expect(hooks.onDragEnd).not.toHaveBeenCalled();
        expect(loggerError).toHaveBeenCalled();
      });
    });

    // this should never really happen - but just being safe
    describe('cleared while drop animating', () => {
      it('should return a result with a null destination', () => {
        const expected: DropResult = {
          draggableId: preset.inHome1.descriptor.id,
          type: preset.home.descriptor.type,
          source: {
            index: preset.inHome1.descriptor.index,
            droppableId: preset.inHome1.descriptor.droppableId,
          },
          destination: null,
        };

        fireHooks(hooks, state.dropAnimating(), state.idle);

        expect(hooks.onDragEnd).toHaveBeenCalledWith(expected);
      });

      it('should log an error and do nothing if it cannot find a previous drag to publish', () => {
        const invalid: State = {
          ...state.dropAnimating(),
          drop: null,
        };

        fireHooks(hooks, invalid, state.idle);

        expect(hooks.onDragEnd).not.toHaveBeenCalled();
        expect(loggerError).toHaveBeenCalled();
      });
    });
  });

  describe('phase unchanged', () => {
    it('should not do anything if the previous and next phase are the same', () => {
      Object.keys(state).forEach((key: string) => {
        const current: State = state[key];

        fireHooks(hooks, current, current);

        expect(hooks.onDragStart).not.toHaveBeenCalled();
        expect(hooks.onDragEnd).not.toHaveBeenCalled();
      });
    });
  });
});
