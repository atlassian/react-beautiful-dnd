// @flow
import {
  cancel,
  clean,
  lift,
  completeDrop,
  prepare,
  completeLift,
  requestDimensions,
  publishDraggableDimensions,
  publishDroppableDimensions,
} from '../../../src/state/action-creators';
import createStore from '../../../src/state/create-store';
import { getPreset } from '../../utils/dimension';
import * as state from '../../utils/simple-state-preset';
import type {
  State,
  Position,
  DraggableId,
  Store,
  InitialDragPositions,
} from '../../../src/types';
import * as logger from '../../../src/log';

jest.mock('../../../src/log');

const preset = getPreset();
const origin: Position = { x: 0, y: 0 };
const noWhere: InitialDragPositions = {
  selection: origin,
  center: origin,
};

type LiftFnArgs = {|
  id: DraggableId,
  client: InitialDragPositions,
  windowScroll: Position,
  isScrollAllowed: boolean,
|}

const liftDefaults: LiftFnArgs = {
  id: preset.inHome1.descriptor.id,
  windowScroll: origin,
  client: noWhere,
  isScrollAllowed: true,
};

const liftWithDefaults = (args?: LiftFnArgs = liftDefaults) => {
  const { id, client, windowScroll, isScrollAllowed } = args;
  return lift(id, client, windowScroll, isScrollAllowed);
};

describe('action creators', () => {
  describe('lift', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
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

      expect(store.dispatch).toHaveBeenCalledWith(requestDimensions(preset.inHome1.descriptor.id));
      expect(store.dispatch).toHaveBeenCalledTimes(2);

      // publishing some fake dimensions
      store.dispatch(publishDroppableDimensions([preset.home]));
      store.dispatch(publishDraggableDimensions([preset.inHome1]));
      // now called four times
      expect(store.dispatch).toHaveBeenCalledTimes(4);

      // Phase 3: after dimensions are collected complete the lift
      jest.runOnlyPendingTimers();

      expect(store.dispatch).toHaveBeenCalledWith(completeLift(
        liftDefaults.id,
        liftDefaults.client,
        liftDefaults.windowScroll,
        liftDefaults.isScrollAllowed
      ));
      expect(store.dispatch).toHaveBeenCalledTimes(5);
    });

    describe('flushing previous drop animations', () => {
      it('should flush any existing drop animation', () => {
        const current: State = state.dropAnimating();
        const dispatch: Function = jest.fn();
        const getState: Function = jest.fn(() => current);

        liftWithDefaults()(dispatch, getState);

        // $ExpectError - not checking for null in state shape
        expect(dispatch).toHaveBeenCalledWith(completeDrop(current.drop.pending.result));
        expect(dispatch).toHaveBeenCalledWith(prepare());
        expect(logger.error).not.toHaveBeenCalled();
      });

      it('should clean the state and log an error if there is an invalid drop animating state', () => {
        const current: State = {
          ...state.idle,
          // hacking the phase
          phase: 'DROP_ANIMATING',
        };
        const dispatch: Function = jest.fn();
        const getState: Function = jest.fn(() => current);

        liftWithDefaults()(dispatch, getState);

        expect(dispatch).toHaveBeenCalledWith(clean());
        expect(logger.error).toHaveBeenCalled();
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

        expect(store.dispatch).toHaveBeenCalledWith(
          requestDimensions(preset.inHome1.descriptor.id)
        );
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
          liftDefaults.client,
          liftDefaults.windowScroll,
          liftDefaults.isScrollAllowed
        ));

        // being super careful
        jest.runAllTimers();
        expect(store.dispatch).toHaveBeenCalledTimes(3);

        // should be in the idle state
        expect(store.getState()).toEqual(state.idle);
      });
    });
  });
});
