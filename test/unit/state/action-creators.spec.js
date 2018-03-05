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
import { getPreset } from '../../utils/dimension';
import getViewport from '../../../src/view/window/get-viewport';
import getStatePreset from '../../utils/get-simple-state-preset';
import type {
  State,
  Position,
  DraggableId,
  Store,
  InitialDragPositions,
  LiftRequest,
  Viewport,
} from '../../../src/types';

const preset = getPreset();
const origin: Position = { x: 0, y: 0 };
const noWhere: InitialDragPositions = {
  selection: origin,
  center: origin,
};

type LiftFnArgs = {|
  id: DraggableId,
  client: InitialDragPositions,
  viewport: Viewport,
  autoScrollMode: 'FLUID' | 'JUMP',
|}

const liftDefaults: LiftFnArgs = {
  id: preset.inHome1.descriptor.id,
  viewport: getViewport(),
  client: noWhere,
  autoScrollMode: 'FLUID',
};

const state = getStatePreset();

const liftWithDefaults = (args?: LiftFnArgs = liftDefaults) => {
  const { id, client, viewport, autoScrollMode } = args;
  return lift(id, client, viewport, autoScrollMode);
};

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

      const request: LiftRequest = {
        draggableId: preset.inHome1.descriptor.id,
        scrollOptions: {
          shouldPublishImmediately: false,
        },
      };
      expect(store.dispatch).toHaveBeenCalledWith(requestDimensions(request));
      expect(store.dispatch).toHaveBeenCalledTimes(2);

      // publishing some fake dimensions
      store.dispatch(publishDroppableDimension(preset.home));
      store.dispatch(publishDraggableDimension(preset.inHome1));
      // now called four times
      expect(store.dispatch).toHaveBeenCalledTimes(4);

      // Phase 3: after dimensions are collected complete the lift
      jest.runOnlyPendingTimers();

      expect(store.dispatch).toHaveBeenCalledWith(completeLift(
        liftDefaults.id,
        liftDefaults.client,
        liftDefaults.viewport,
        liftDefaults.autoScrollMode,
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
        expect(console.error).not.toHaveBeenCalled();
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
            liftDefaults.client,
            liftDefaults.viewport,
            liftDefaults.autoScrollMode,
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
          requestDimensions({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: {
              shouldPublishImmediately: false,
            },
          })
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
          liftDefaults.viewport,
          liftDefaults.autoScrollMode,
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
