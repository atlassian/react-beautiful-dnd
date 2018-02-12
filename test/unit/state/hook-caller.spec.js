// @flow
import createHookCaller from '../../../src/state/hooks/hook-caller';
import messagePreset from '../../../src/state/hooks/message-preset';
import type { HookCaller } from '../../../src/state/hooks/hooks-types';
import * as state from '../../utils/simple-state-preset';
import { getPreset } from '../../utils/dimension';
import noImpact, { noMovement } from '../../../src/state/no-impact';
import type {
  Announce,
  Hooks,
  HookProvided,
  DropResult,
  State,
  DimensionState,
  DraggableLocation,
  DraggableDescriptor,
  DroppableDimension,
  DragStart,
  DragUpdate,
  DragImpact,
} from '../../../src/types';

const preset = getPreset();

const noDimensions: DimensionState = {
  request: null,
  draggable: {},
  droppable: {},
};

describe('fire hooks', () => {
  let hooks: Hooks;
  let caller: HookCaller;
  let announceMock: Announce;

  beforeEach(() => {
    jest.useFakeTimers();
    announceMock = jest.fn();
    caller = createHookCaller(announceMock);
    hooks = {
      onDragStart: jest.fn(),
      onDragUpdate: jest.fn(),
      onDragEnd: jest.fn(),
    };
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
    jest.useRealTimers();
  });

  describe('drag start', () => {
    it('should call the onDragStart hook when a drag starts', () => {
      const expected: DragStart = {
        draggableId: preset.inHome1.descriptor.id,
        type: preset.home.descriptor.type,
        source: {
          droppableId: preset.inHome1.descriptor.droppableId,
          index: preset.inHome1.descriptor.index,
        },
      };

      caller.onStateChange(hooks, state.requesting(), state.dragging());

      expect(hooks.onDragStart).toHaveBeenCalledWith(expected, {
        announce: expect.any(Function),
      });
    });

    it('should log an error and not call the callback if there is no current drag', () => {
      const invalid: State = {
        ...state.dragging(),
        drag: null,
      };

      caller.onStateChange(hooks, state.requesting(), invalid);

      expect(console.error).toHaveBeenCalled();
    });

    it('should not call if only collecting dimensions (not dragging yet)', () => {
      caller.onStateChange(hooks, state.idle, state.preparing);
      caller.onStateChange(hooks, state.preparing, state.requesting());

      expect(hooks.onDragStart).not.toHaveBeenCalled();
    });

    describe('announcements', () => {
      const getDragStart = (appState: State): ?DragStart => {
        if (!appState.drag) {
          return null;
        }

        const descriptor: DraggableDescriptor = appState.drag.initial.descriptor;
        const home: ?DroppableDimension = appState.dimension.droppable[descriptor.droppableId];

        if (!home) {
          return null;
        }

        const source: DraggableLocation = {
          index: descriptor.index,
          droppableId: descriptor.droppableId,
        };

        const start: DragStart = {
          draggableId: descriptor.id,
          type: home.descriptor.type,
          source,
        };

        return start;
      };

      const dragStart: ?DragStart = getDragStart(state.dragging());
      if (!dragStart) {
        throw new Error('Invalid test setup');
      }

      it('should announce with the default lift message if no message is provided', () => {
        caller.onStateChange(hooks, state.requesting(), state.dragging());

        expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragStart(dragStart));
      });

      it('should announce with the default lift message if no onDragStart hook is provided', () => {
        const customHooks: Hooks = {
          onDragEnd: jest.fn(),
        };

        caller.onStateChange(customHooks, state.requesting(), state.dragging());

        expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragStart(dragStart));
      });

      it('should announce with a provided message', () => {
        const customHooks: Hooks = {
          onDragStart: (start: DragStart, provided: HookProvided) => provided.announce('test'),
          onDragEnd: jest.fn(),
        };

        caller.onStateChange(customHooks, state.requesting(), state.dragging());

        expect(announceMock).toHaveBeenCalledTimes(1);
        expect(announceMock).toHaveBeenCalledWith('test');
      });

      it('should prevent double announcing', () => {
        let myAnnounce: ?Announce;
        const customHooks: Hooks = {
          onDragStart: (start: DragStart, provided: HookProvided) => {
            myAnnounce = provided.announce;
            myAnnounce('test');
          },
          onDragEnd: jest.fn(),
        };

        caller.onStateChange(customHooks, state.requesting(), state.dragging());
        expect(announceMock).toHaveBeenCalledWith('test');
        expect(announceMock).toHaveBeenCalledTimes(1);
        expect(console.warn).not.toHaveBeenCalled();

        if (!myAnnounce) {
          throw new Error('Invalid test setup');
        }

        myAnnounce('second');

        expect(announceMock).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalled();
      });

      it('should prevent async announcing', () => {
        const customHooks: Hooks = {
          onDragStart: (start: DragStart, provided: HookProvided) => {
            setTimeout(() => {
              // boom
              provided.announce('too late');
            });
          },
          onDragEnd: jest.fn(),
        };

        caller.onStateChange(customHooks, state.requesting(), state.dragging());
        expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragStart(dragStart));
        expect(console.warn).not.toHaveBeenCalled();

        // not releasing the async message
        jest.runOnlyPendingTimers();

        expect(announceMock).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalled();
      });
    });
  });

  describe('drag update', () => {
    const withImpact = (current: State, impact: DragImpact) => {
      if (!current.drag) {
        throw new Error('invalid state');
      }
      return {
        ...current,
        drag: {
          ...current.drag,
          impact,
        },
      };
    };

    const start: DragStart = {
      draggableId: preset.inHome1.descriptor.id,
      type: preset.home.descriptor.type,
      source: {
        index: preset.inHome1.descriptor.index,
        droppableId: preset.inHome1.descriptor.droppableId,
      },
    };

    const inHomeImpact: DragImpact = {
      movement: noMovement,
      direction: preset.home.axis.direction,
      destination: start.source,
    };

    describe('has not moved from home location', () => {
      beforeEach(() => {
        // start a drag
        caller.onStateChange(
          hooks,
          state.requesting(),
          withImpact(state.dragging(), inHomeImpact),
        );
        expect(hooks.onDragUpdate).not.toHaveBeenCalled();
      });

      it('should not provide an update if the location has not changed since the last drag', () => {
        // drag to the same spot
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), inHomeImpact),
          withImpact(state.dragging(), inHomeImpact),
        );

        expect(hooks.onDragUpdate).not.toHaveBeenCalled();
      });

      it('should provide an update if the index changes', () => {
        const destination: DraggableLocation = {
          index: preset.inHome1.descriptor.index + 1,
          droppableId: preset.inHome1.descriptor.droppableId,
        };
        const impact: DragImpact = {
          movement: noMovement,
          direction: preset.home.axis.direction,
          destination,
        };
        const expected: DragUpdate = {
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination,
        };

        // drag to the same spot
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), inHomeImpact),
          withImpact(state.dragging(), impact),
        );

        expect(hooks.onDragUpdate).toHaveBeenCalledWith(expected, {
          announce: expect.any(Function),
        });
      });

      it('should provide an update if the droppable changes', () => {
        const destination: DraggableLocation = {
          // same index
          index: preset.inHome1.descriptor.index,
          // different droppable
          droppableId: preset.foreign.descriptor.id,
        };
        const impact: DragImpact = {
          movement: noMovement,
          direction: preset.home.axis.direction,
          destination,
        };
        const expected: DragUpdate = {
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination,
        };

        // drag to the same spot
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), inHomeImpact),
          withImpact(state.dragging(), impact),
        );

        expect(hooks.onDragUpdate).toHaveBeenCalledWith(expected, {
          announce: expect.any(Function),
        });
      });

      it('should provide an update if moving from a droppable to nothing', () => {
        const expected: DragUpdate = {
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination: null,
        };

        // drag to the same spot
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), inHomeImpact),
          withImpact(state.dragging(), noImpact),
        );

        expect(hooks.onDragUpdate).toHaveBeenCalledWith(expected, {
          announce: expect.any(Function),
        });
      });

      describe('announcements', () => {
        const destination: DraggableLocation = {
          // new index
          index: preset.inHome1.descriptor.index + 1,
          // different droppable
          droppableId: preset.inHome1.descriptor.droppableId,
        };
        const updateImpact: DragImpact = {
          movement: noMovement,
          direction: preset.home.axis.direction,
          destination,
        };
        const dragUpdate: DragUpdate = {
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination,
        };
        const inHome = withImpact(state.dragging(), inHomeImpact);
        const withUpdate = withImpact(state.dragging(), updateImpact);

        const perform = (myHooks: Hooks) => {
          caller.onStateChange(myHooks, inHome, withUpdate);
        };

        beforeEach(() => {
          // from the lift
          expect(announceMock).toHaveBeenCalledTimes(1);
          // clear its state
          announceMock.mockReset();
        });

        it('should announce with the default update message if no message is provided', () => {
          caller.onStateChange(hooks, inHome, withUpdate);

          expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragUpdate(dragUpdate));
        });

        it('should announce with the default update message if no onDragUpdate hook is provided', () => {
          const customHooks: Hooks = {
            onDragEnd: jest.fn(),
          };

          perform(customHooks);

          expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragUpdate(dragUpdate));
        });

        it('should announce with a provided message', () => {
          const customHooks: Hooks = {
            onDragUpdate: (update: DragUpdate, provided: HookProvided) => provided.announce('test'),
            onDragEnd: jest.fn(),
          };

          perform(customHooks);

          expect(announceMock).toHaveBeenCalledTimes(1);
          expect(announceMock).toHaveBeenCalledWith('test');
        });

        it('should prevent double announcing', () => {
          let myAnnounce: ?Announce;
          const customHooks: Hooks = {
            onDragUpdate: (update: DragUpdate, provided: HookProvided) => {
              myAnnounce = provided.announce;
              myAnnounce('test');
            },
            onDragEnd: jest.fn(),
          };

          perform(customHooks);

          expect(announceMock).toHaveBeenCalledWith('test');
          expect(announceMock).toHaveBeenCalledTimes(1);
          expect(console.warn).not.toHaveBeenCalled();

          if (!myAnnounce) {
            throw new Error('Invalid test setup');
          }

          myAnnounce('second');

          expect(announceMock).toHaveBeenCalledTimes(1);
          expect(console.warn).toHaveBeenCalled();
        });

        it('should prevent async announcing', () => {
          const customHooks: Hooks = {
            onDragUpdate: (update: DragUpdate, provided: HookProvided) => {
              setTimeout(() => {
                // boom
                provided.announce('too late');
              });
            },
            onDragEnd: jest.fn(),
          };

          perform(customHooks);

          expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragUpdate(dragUpdate));
          expect(console.warn).not.toHaveBeenCalled();

          // not releasing the async message
          jest.runOnlyPendingTimers();

          expect(announceMock).toHaveBeenCalledTimes(1);
          expect(console.warn).toHaveBeenCalled();
        });
      });
    });

    describe('no longer in home location', () => {
      const firstImpact: DragImpact = {
        movement: noMovement,
        direction: preset.home.axis.direction,
        // moved into the second index
        destination: {
          index: preset.inHome1.descriptor.index + 1,
          droppableId: preset.inHome1.descriptor.droppableId,
        },
      };

      beforeEach(() => {
        // initial lift
        caller.onStateChange(
          hooks,
          state.requesting(),
          withImpact(state.dragging(), inHomeImpact),
        );
        // checking everything is well
        expect(hooks.onDragStart).toHaveBeenCalled();
        expect(hooks.onDragUpdate).not.toHaveBeenCalled();

        // first move into new location
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), inHomeImpact),
          withImpact(state.dragging(), firstImpact),
        );

        expect(hooks.onDragUpdate).toHaveBeenCalled();
        // cleaning the hook
        // $ExpectError - no mock reset property
        hooks.onDragUpdate.mockReset();
      });

      it('should not provide an update if the location has not changed since the last drag', () => {
        // drag to the same spot
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), firstImpact),
          withImpact(state.dragging(), firstImpact),
        );

        expect(hooks.onDragUpdate).not.toHaveBeenCalled();
      });

      it('should provide an update if the index changes', () => {
        const destination: DraggableLocation = {
          index: preset.inHome1.descriptor.index + 2,
          droppableId: preset.inHome1.descriptor.droppableId,
        };
        const secondImpact: DragImpact = {
          movement: noMovement,
          direction: preset.home.axis.direction,
          destination,
        };
        const expected: DragUpdate = {
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination,
        };

        // drag to the same spot
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), firstImpact),
          withImpact(state.dragging(), secondImpact),
        );

        expect(hooks.onDragUpdate).toHaveBeenCalledWith(expected, {
          announce: expect.any(Function),
        });
      });

      it('should provide an update if the droppable changes', () => {
        const destination: DraggableLocation = {
          index: preset.inHome1.descriptor.index + 1,
          droppableId: preset.foreign.descriptor.id,
        };
        const secondImpact: DragImpact = {
          movement: noMovement,
          direction: preset.home.axis.direction,
          destination,
        };
        const expected: DragUpdate = {
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination,
        };

        // drag to the same spot
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), firstImpact),
          withImpact(state.dragging(), secondImpact),
        );

        expect(hooks.onDragUpdate).toHaveBeenCalledWith(expected, {
          announce: expect.any(Function),
        });
      });

      it('should provide an update if moving from a droppable to nothing', () => {
        const secondImpact: DragImpact = {
          movement: noMovement,
          direction: null,
          destination: null,
        };
        const expected: DragUpdate = {
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination: null,
        };

        // drag to the same spot
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), firstImpact),
          withImpact(state.dragging(), secondImpact),
        );

        expect(hooks.onDragUpdate).toHaveBeenCalledWith(expected, {
          announce: expect.any(Function),
        });
      });

      it('should provide an update if moving back to the home location', () => {
        const impact: DragImpact = {
          movement: noMovement,
          direction: preset.home.axis.direction,
          destination: null,
        };

        // drag to nowhere
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), inHomeImpact),
          withImpact(state.dragging(), impact),
        );
        const first: DragUpdate = {
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination: null,
        };

        expect(hooks.onDragUpdate).toHaveBeenCalledWith(first, {
          announce: expect.any(Function),
        });

        // drag back to home
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), impact),
          withImpact(state.dragging(), inHomeImpact),
        );
        const second: DragUpdate = {
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination: start.source,
        };
        expect(hooks.onDragUpdate).toHaveBeenCalledWith(second, {
          announce: expect.any(Function),
        });
      });

      describe('announcements', () => {
        const destination: DraggableLocation = {
          // new index
          index: preset.inHome1.descriptor.index + 2,
          // different droppable
          droppableId: preset.inHome1.descriptor.droppableId,
        };
        const secondImpact: DragImpact = {
          movement: noMovement,
          direction: preset.home.axis.direction,
          destination,
        };
        const secondUpdate: DragUpdate = {
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination,
        };
        const withFirstUpdate = withImpact(state.dragging(), firstImpact);
        const withSecondUpdate = withImpact(state.dragging(), secondImpact);

        const perform = (myHooks: Hooks) => {
          caller.onStateChange(myHooks, withFirstUpdate, withSecondUpdate);
        };

        beforeEach(() => {
          // clear its state from previous updates
          announceMock.mockReset();
        });

        it('should announce with the default update message if no message is provided', () => {
          caller.onStateChange(hooks, withFirstUpdate, withSecondUpdate);

          expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragUpdate(secondUpdate));
        });

        it('should announce with the default update message if no onDragUpdate hook is provided', () => {
          const customHooks: Hooks = {
            onDragEnd: jest.fn(),
          };

          perform(customHooks);

          expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragUpdate(secondUpdate));
        });

        it('should announce with a provided message', () => {
          const customHooks: Hooks = {
            onDragUpdate: (update: DragUpdate, provided: HookProvided) => provided.announce('test'),
            onDragEnd: jest.fn(),
          };

          perform(customHooks);

          expect(announceMock).toHaveBeenCalledTimes(1);
          expect(announceMock).toHaveBeenCalledWith('test');
        });

        it('should prevent double announcing', () => {
          let myAnnounce: ?Announce;
          const customHooks: Hooks = {
            onDragUpdate: (update: DragUpdate, provided: HookProvided) => {
              myAnnounce = provided.announce;
              myAnnounce('test');
            },
            onDragEnd: jest.fn(),
          };

          perform(customHooks);

          expect(announceMock).toHaveBeenCalledWith('test');
          expect(announceMock).toHaveBeenCalledTimes(1);
          expect(console.warn).not.toHaveBeenCalled();

          if (!myAnnounce) {
            throw new Error('Invalid test setup');
          }

          myAnnounce('second');

          expect(announceMock).toHaveBeenCalledTimes(1);
          expect(console.warn).toHaveBeenCalled();
        });

        it('should prevent async announcing', () => {
          const customHooks: Hooks = {
            onDragUpdate: (update: DragUpdate, provided: HookProvided) => {
              setTimeout(() => {
                // boom
                provided.announce('too late');
              });
            },
            onDragEnd: jest.fn(),
          };

          perform(customHooks);

          expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragUpdate(secondUpdate));
          expect(console.warn).not.toHaveBeenCalled();

          // not releasing the async message
          jest.runOnlyPendingTimers();

          expect(announceMock).toHaveBeenCalledTimes(1);
          expect(console.warn).toHaveBeenCalled();
        });
      });
    });

    describe('multiple updates', () => {
      it('should correctly update across multiple updates', () => {
        // initial lift
        caller.onStateChange(
          hooks,
          state.requesting(),
          withImpact(state.dragging(), inHomeImpact),
        );
        // checking everything is well
        expect(hooks.onDragStart).toHaveBeenCalled();
        expect(hooks.onDragUpdate).not.toHaveBeenCalled();

        // first move into new location
        const firstImpact: DragImpact = {
          movement: noMovement,
          direction: preset.home.axis.direction,
          // moved into the second index
          destination: {
            index: preset.inHome1.descriptor.index + 1,
            droppableId: preset.inHome1.descriptor.droppableId,
          },
        };
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), inHomeImpact),
          withImpact(state.dragging(), firstImpact),
        );

        expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
        expect(hooks.onDragUpdate).toHaveBeenCalledWith({
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination: firstImpact.destination,
        }, { announce: expect.any(Function) });

        // second move into new location
        const secondImpact: DragImpact = {
          movement: noMovement,
          direction: preset.home.axis.direction,
          // moved into the second index
          destination: {
            index: preset.inHome1.descriptor.index + 2,
            droppableId: preset.inHome1.descriptor.droppableId,
          },
        };
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), firstImpact),
          withImpact(state.dragging(), secondImpact),
        );

        expect(hooks.onDragUpdate).toHaveBeenCalledTimes(2);
        expect(hooks.onDragUpdate).toHaveBeenCalledWith({
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination: secondImpact.destination,
        }, { announce: expect.any(Function) });
      });

      it('should update correctly across multiple drags', () => {
        // initial lift
        caller.onStateChange(
          hooks,
          state.requesting(),
          withImpact(state.dragging(), inHomeImpact),
        );
        // checking everything is well
        expect(hooks.onDragStart).toHaveBeenCalled();
        expect(hooks.onDragUpdate).not.toHaveBeenCalled();

        // first move into new location
        const firstImpact: DragImpact = {
          movement: noMovement,
          direction: preset.home.axis.direction,
          // moved into the second index
          destination: {
            index: preset.inHome1.descriptor.index + 1,
            droppableId: preset.inHome1.descriptor.droppableId,
          },
        };
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), inHomeImpact),
          withImpact(state.dragging(), firstImpact),
        );
        expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
        expect(hooks.onDragUpdate).toHaveBeenCalledWith({
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination: firstImpact.destination,
        }, { announce: expect.any(Function) });
        // resetting the mock
        // $ExpectError - resetting mock
        hooks.onDragUpdate.mockReset();

        // drop
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), firstImpact),
          state.idle,
        );

        expect(hooks.onDragUpdate).not.toHaveBeenCalled();

        // a new lift!
        caller.onStateChange(
          hooks,
          state.requesting(),
          withImpact(state.dragging(), inHomeImpact),
        );
        // checking everything is well
        expect(hooks.onDragStart).toHaveBeenCalled();
        expect(hooks.onDragUpdate).not.toHaveBeenCalled();

        // first move into new location
        caller.onStateChange(
          hooks,
          withImpact(state.dragging(), inHomeImpact),
          withImpact(state.dragging(), firstImpact),
        );
        expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
        expect(hooks.onDragUpdate).toHaveBeenCalledWith({
          draggableId: start.draggableId,
          type: start.type,
          source: start.source,
          destination: firstImpact.destination,
        }, { announce: expect.any(Function) });
      });
    });
  });

  describe('drag end', () => {
    // it is possible to complete a drag from a DRAGGING or DROP_ANIMATING (drop or cancel)
    const preEndStates: State[] = [
      state.dragging(),
      state.dropAnimating(),
      state.userCancel(),
    ];

    preEndStates.forEach((previous: State, index: number): void => {
      describe(`end state ${index}`, () => {
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
            reason: 'DROP',
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

          caller.onStateChange(hooks, previous, current);

          if (!current.drop || !current.drop.result) {
            throw new Error('invalid state');
          }

          const provided: DropResult = current.drop.result;
          expect(hooks.onDragEnd).toHaveBeenCalledWith(provided, {
            announce: expect.any(Function),
          });
        });

        it('should log an error and not call the callback if there is no drop result', () => {
          const invalid: State = {
            ...state.dropComplete(),
            drop: null,
          };

          caller.onStateChange(hooks, previous, invalid);

          expect(hooks.onDragEnd).not.toHaveBeenCalled();
          expect(console.error).toHaveBeenCalled();
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
            reason: 'DROP',
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

          caller.onStateChange(hooks, previous, current);

          expect(hooks.onDragEnd).toHaveBeenCalledWith(result, {
            announce: expect.any(Function),
          });
        });

        it('should call onDragEnd with original source if the item did not move', () => {
          const source: DraggableLocation = {
            droppableId: preset.inHome1.descriptor.droppableId,
            index: preset.inHome1.descriptor.index,
          };
          const result: DropResult = {
            draggableId: preset.inHome1.descriptor.id,
            type: preset.home.descriptor.type,
            source,
            destination: source,
            reason: 'DROP',
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
          const expected: DropResult = {
            draggableId: result.draggableId,
            type: result.type,
            source: result.source,
            // destination has been cleared
            destination: source,
            reason: 'DROP',
          };

          caller.onStateChange(hooks, previous, current);

          expect(hooks.onDragEnd).toHaveBeenCalledWith(expected, {
            announce: expect.any(Function),
          });
        });

        describe('announcements', () => {
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
            reason: 'DROP',
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

          const perform = (myHooks: Hooks) => {
            caller.onStateChange(myHooks, previous, current);
          };

          beforeEach(() => {
            // clear its state from previous updates
            announceMock.mockReset();
          });

          it('should announce with the default update message if no message is provided', () => {
            perform(hooks);

            expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragEnd(result));
          });

          it('should announce with the default update message if no onDragEnd hook is provided', () => {
            const customHooks: Hooks = {
              onDragEnd: jest.fn(),
            };

            perform(customHooks);

            expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragEnd(result));
          });

          it('should announce with a provided message', () => {
            const customHooks: Hooks = {
              onDragEnd: (drop: DropResult, provided: HookProvided) => provided.announce('the end'),
            };

            perform(customHooks);

            expect(announceMock).toHaveBeenCalledTimes(1);
            expect(announceMock).toHaveBeenCalledWith('the end');
          });

          it('should prevent double announcing', () => {
            let myAnnounce: ?Announce;
            const customHooks: Hooks = {
              onDragEnd: (drop: DropResult, provided: HookProvided) => {
                myAnnounce = provided.announce;
                myAnnounce('test');
              },
            };

            perform(customHooks);

            expect(announceMock).toHaveBeenCalledWith('test');
            expect(announceMock).toHaveBeenCalledTimes(1);
            expect(console.warn).not.toHaveBeenCalled();

            if (!myAnnounce) {
              throw new Error('Invalid test setup');
            }

            myAnnounce('second');

            expect(announceMock).toHaveBeenCalledTimes(1);
            expect(console.warn).toHaveBeenCalled();
          });

          it('should prevent async announcing', () => {
            const customHooks: Hooks = {
              onDragEnd: (drop: DropResult, provided: HookProvided) => {
                setTimeout(() => {
                  // boom
                  provided.announce('too late');
                });
              },
            };

            perform(customHooks);

            expect(announceMock).toHaveBeenCalledWith(messagePreset.onDragEnd(result));
            expect(console.warn).not.toHaveBeenCalled();

            // not releasing the async message
            jest.runOnlyPendingTimers();

            expect(announceMock).toHaveBeenCalledTimes(1);
            expect(console.warn).toHaveBeenCalled();
          });
        });
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
          reason: 'CANCEL',
        };

        caller.onStateChange(hooks, state.dragging(), state.idle);

        expect(hooks.onDragEnd).toHaveBeenCalledWith(expected, {
          announce: expect.any(Function),
        });
      });

      it('should log an error and do nothing if it cannot find a previous drag to publish', () => {
        const invalid: State = {
          phase: 'DRAGGING',
          drag: null,
          drop: null,
          dimension: noDimensions,
        };

        caller.onStateChange(hooks, state.idle, invalid);

        expect(hooks.onDragEnd).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
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
          reason: 'CANCEL',
        };

        caller.onStateChange(hooks, state.dropAnimating(), state.idle);

        expect(hooks.onDragEnd).toHaveBeenCalledWith(expected, {
          announce: expect.any(Function),
        });
      });

      it('should log an error and do nothing if it cannot find a previous drag to publish', () => {
        const invalid: State = {
          ...state.dropAnimating(),
          drop: null,
        };

        caller.onStateChange(hooks, invalid, state.idle);

        expect(hooks.onDragEnd).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('phase unchanged', () => {
    it('should not do anything if the previous and next phase are the same', () => {
      Object.keys(state).forEach((key: string) => {
        const current: State = state[key];

        caller.onStateChange(hooks, current, current);

        expect(hooks.onDragStart).not.toHaveBeenCalled();
        expect(hooks.onDragUpdate).not.toHaveBeenCalled();
        expect(hooks.onDragEnd).not.toHaveBeenCalled();
      });
    });
  });
});
