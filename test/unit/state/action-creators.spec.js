// @flow
import {
  cancel,
  clean,
  lift,
  completeDrop,
  prepare,
  completeLift,
} from '../../../src/state/action-creators';
import createStore from '../../../src/state/create-store';
import noImpact from '../../../src/state/no-impact';
import type {
  State,
  Position,
  DraggableId,
  TypeId,
  Store,
  InitialDragLocation,
  PendingDrop,
  DimensionState,
} from '../../../src/types';

const origin: Position = { x: 0, y: 0 };
const noWhere: InitialDragLocation = {
  selection: origin,
  center: origin,
};
const noDimensions: DimensionState = {
  request: null,
  draggable: {},
  droppable: {},
};
type LiftFnArgs = {
  id: DraggableId,
  type: TypeId,
  client: InitialDragLocation,
  windowScroll: Position,
  isScrollAllowed: boolean,
}

const draggableId: DraggableId = 'drag-1';
const defaultType: TypeId = 'type';

const liftDefaults: LiftFnArgs = {
  id: draggableId,
  type: defaultType,
  windowScroll: origin,
  client: noWhere,
  isScrollAllowed: true,
};

const liftWithDefaults = (args?: LiftFnArgs = liftDefaults) => {
  const { id, type, client, windowScroll, isScrollAllowed } = args;
  return lift(id, type, client, windowScroll, isScrollAllowed);
};

const initialState: State = createStore().getState();

describe('action creators', () => {
  describe('lift', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
      jest.useRealTimers();
      console.error.mockRestore();
    });

    describe('flushing previous drop animations', () => {
      const dropAnimatingState: State = (() => {
        const pending: PendingDrop = {
          trigger: 'CANCEL',
          newHomeOffset: origin,
          impact: noImpact,
          result: {
            draggableId,
            type: defaultType,
            source: {
              droppableId: 'drop-1',
              index: 0,
            },
            destination: null,
          },
        };
        const state: State = {
          phase: 'DROP_ANIMATING',
          drag: null,
          drop: {
            pending,
            result: null,
          },
          dimension: noDimensions,
        };
        return state;
      })();

      it('should flush any existing drop animation', () => {
        const dispatch: Function = jest.fn();
        const getState: Function = jest.fn(() => dropAnimatingState);

        liftWithDefaults()(dispatch, getState);

        expect(dispatch).toHaveBeenCalledWith(completeDrop(dropAnimatingState.drop.pending.result));
        expect(dispatch).toHaveBeenCalledWith(prepare());
        expect(console.error).not.toHaveBeenCalled();
      });

      it('should clean the state and log an error if there is an invalid drop animating state', () => {
        const state: State = {
          ...initialState,
          // hacking the phase
          phase: 'DROP_ANIMATING',
        };
        const dispatch: Function = jest.fn();
        const getState: Function = jest.fn(() => state);

        liftWithDefaults()(dispatch, getState);

        expect(dispatch).toHaveBeenCalledWith(clean());
        expect(console.error).toHaveBeenCalled();
      });

      it('should not begin a lift if the drag is cancelled while the animations are flushing', () => {
        const store: Store = createStore();
        jest.spyOn(store, 'dispatch');

        liftWithDefaults()(store.dispatch, store.getState);
        // flushing
        expect(store.dispatch).toHaveBeenCalledWith(prepare());

        // need to wait for setTimeout to flush
        expect(store.dispatch).toHaveBeenCalledTimes(1);

        // while waiting a cancel occurs
        cancel()(store.dispatch, store.getState);

        // because a drag was not occurring the state is cleaned
        expect(store.dispatch).toHaveBeenCalledWith(clean());
        // now called two times
        expect(store.dispatch).toHaveBeenCalledTimes(2);

        // now ticking the setTimeout
        jest.runOnlyPendingTimers();

        // normally would start requesting dimensions
        expect(store.dispatch).not.toHaveBeenCalledWith(
          completeLift(
            liftDefaults.id,
            liftDefaults.type,
            liftDefaults.client,
            liftDefaults.windowScroll,
            liftDefaults.isScrollAllowed
          )
        );

        // dispatch not called since previous clean
        expect(store.dispatch).toHaveBeenCalledTimes(2);
      });
    });

    describe('dimensions collected and drag not started', () => {
      it('should not continue to lift if cancelled', () => {

      });
    });
  });
});
