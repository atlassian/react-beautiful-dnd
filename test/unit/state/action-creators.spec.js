// @flow
import {
  cancel,
  clean,
  lift,
  completeDrop,
  prepare,
  completeLift,
  requestDimensions,
  publishDraggableDimension,
  publishDroppableDimension,
} from '../../../src/state/action-creators';
import createStore from '../../../src/state/create-store';
import noImpact from '../../../src/state/no-impact';
import { getPreset } from '../../utils/dimension';
import type {
  State,
  Position,
  DraggableId,
  TypeId,
  Store,
  InitialDragPositions,
  PendingDrop,
  DimensionState,
} from '../../../src/types';

const { home, inHome1 } = getPreset();

const origin: Position = { x: 0, y: 0 };
const noWhere: InitialDragPositions = {
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
  client: InitialDragPositions,
  windowScroll: Position,
  isScrollAllowed: boolean,
}

const draggableId: DraggableId = inHome1.descriptor.id;
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

    // This test is more a baseline for the others
    // to ensure that the happy path works correctly
    it('should perform a multi phased lift', () => {
      const store: Store = createStore();
      jest.spyOn(store, 'dispatch');

      liftWithDefaults()(store.dispatch, store.getState);

      // Phase 1: flush any existing animations
      expect(store.dispatch).toHaveBeenCalledWith(prepare());
      expect(store.dispatch).toHaveBeenCalledTimes(1);

      // Phase 2: request dimensions after flushing animations
      jest.runOnlyPendingTimers();

      expect(store.dispatch).toHaveBeenCalledWith(requestDimensions(defaultType));
      expect(store.dispatch).toHaveBeenCalledTimes(2);

      // publishing some fake dimensions
      store.dispatch(publishDroppableDimension(home));
      store.dispatch(publishDraggableDimension(inHome1));
      // now called four times
      expect(store.dispatch).toHaveBeenCalledTimes(4);

      // Phase 3: after dimensions are collected complete the lift
      jest.runOnlyPendingTimers();

      expect(store.dispatch).toHaveBeenCalledWith(completeLift(
        liftDefaults.id,
        liftDefaults.type,
        liftDefaults.client,
        liftDefaults.windowScroll,
        liftDefaults.isScrollAllowed
      ));
      expect(store.dispatch).toHaveBeenCalledTimes(5);
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

        // $ExpectError - not checking for null in state shape
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
        const store: Store = createStore();
        jest.spyOn(store, 'dispatch');

        liftWithDefaults()(store.dispatch, store.getState);

        // Phase 1: flush any existing animations
        expect(store.dispatch).toHaveBeenCalledWith(prepare());
        expect(store.dispatch).toHaveBeenCalledTimes(1);

        // Phase 2: request dimensions after flushing animations
        jest.runOnlyPendingTimers();

        expect(store.dispatch).toHaveBeenCalledWith(requestDimensions(defaultType));
        expect(store.dispatch).toHaveBeenCalledTimes(2);

        // drag is now cancelled before all dimensions are published
        cancel()(store.dispatch, store.getState);
        expect(store.dispatch).toHaveBeenCalledTimes(3);

        // This would usually start phase three: lift
        jest.runOnlyPendingTimers();

        // no increase in the amount of times called
        expect(store.dispatch).toHaveBeenCalledTimes(3);
        expect(store.dispatch).not.toHaveBeenCalledWith(completeLift(
          liftDefaults.id,
          liftDefaults.type,
          liftDefaults.client,
          liftDefaults.windowScroll,
          liftDefaults.isScrollAllowed
        ));

        // being super careful
        jest.runAllTimers();
        expect(store.dispatch).toHaveBeenCalledTimes(3);

        // should be in the idle state
        expect(store.getState()).toEqual(initialState);
      });
    });
  });
});
