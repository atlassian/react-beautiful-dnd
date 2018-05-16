// @flow
import invariant from 'tiny-invariant';
import middleware from '../../../../src/state/middleware/drop';
import createStore from './util/create-store';
import { add } from '../../../../src/state/position';
import {
  clean,
  drop,
  prepare,
  initialPublish,
  bulkReplace,
  animateDrop,
  dropPending,
  move,
  completeDrop,
} from '../../../../src/state/action-creators';
import {
  initialPublishArgs,
  initialBulkReplaceArgs,
  getDragStart,
} from './util/preset-action-args';
import type {
  Store,
  State,
  DropResult,
  PendingDrop,
  DraggableLocation,
  DropReason,
} from '../../../../src/types';

it('should throw an error if a drop action occurs while not in a phase where you can drop', () => {
  const store: Store = createStore(middleware);

  // idle
  expect(() => {
    store.dispatch(drop({ reason: 'DROP' }));
  }).toThrow();

  // prepare
  expect(() => {
    store.dispatch(prepare());
    store.dispatch(drop({ reason: 'DROP' }));
  }).toThrow();

  // drop animating
  store.dispatch(clean());
  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(bulkReplace(initialBulkReplaceArgs));
  expect(store.getState().phase).toBe('DRAGGING');

  // moving a little bit so that a drop animation will be needed
  store.dispatch(move({
    client: add(initialPublishArgs.client.selection, { x: 1, y: 1 }),
    shouldAnimate: true,
  }));

  store.dispatch(drop({ reason: 'DROP' }));
  expect(store.getState().phase).toBe('DROP_ANIMATING');

  expect(() => store.dispatch(drop({ reason: 'DROP' }))).toThrow();
});

it('should dispatch a DROP_PENDING action if BULK_COLLECTING', () => {
  const mock = jest.fn();
  const passThrough = () => next => (action) => {
    mock(action);
    next(action);
  };
  const store: Store = createStore(
    passThrough,
    middleware,
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));

  // now in the bulk collecting phase
  expect(store.getState().phase).toBe('BULK_COLLECTING');
  mock.mockReset();

  // drop
  store.dispatch(drop({ reason: 'DROP' }));

  expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledWith(dropPending({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledTimes(2);
  expect(store.getState().phase).toBe('DROP_PENDING');
});

it('should not do anything if a drop action is fired and there is DROP_PENDING and it is waiting for a publish', () => {
  const mock = jest.fn();
  const passThrough = () => next => (action) => {
    mock(action);
    next(action);
  };
  const store: Store = createStore(
    passThrough,
    middleware,
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));

  // now in the bulk collecting phase
  expect(store.getState().phase).toBe('BULK_COLLECTING');
  mock.mockReset();

  // drop moving to drop pending
  store.dispatch(drop({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledWith(dropPending({ reason: 'DROP' }));

  const state: State = store.getState();
  invariant(state.phase === 'DROP_PENDING', 'invalid phase');

  expect(state.isWaiting).toBe(true);

  // Drop action being fired (should not happen)

  mock.mockReset();
  store.dispatch(drop({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));
});

describe('no drop animation required', () => {
  const reasons: DropReason[] = ['DROP', 'CANCEL'];

  reasons.forEach((reason: DropReason) => {
    describe(`with drop reason: ${reason}`, () => {
      it('should fire a complete drop action is no drop animation is required', () => {
        const mock = jest.fn();
        const passThrough = () => next => (action) => {
          mock(action);
          next(action);
        };
        const store: Store = createStore(
          passThrough,
          middleware,
        );

        store.dispatch(clean());
        store.dispatch(prepare());
        store.dispatch(initialPublish(initialPublishArgs));
        store.dispatch(bulkReplace(initialBulkReplaceArgs));
        expect(store.getState().phase).toBe('DRAGGING');

        // no movement yet
        mock.mockReset();
        store.dispatch(drop({ reason }));

        const destination: ?DraggableLocation = (() => {
        // destination is cleared when cancelling
          if (reason === 'CANCEL') {
            return null;
          }

          return getDragStart(initialPublishArgs.critical).source;
        })();

        const result: DropResult = {
          ...getDragStart(initialPublishArgs.critical),
          destination,
          reason,
        };
        expect(mock).toHaveBeenCalledWith(drop({ reason }));
        expect(mock).toHaveBeenCalledWith(completeDrop(result));
        expect(mock).toHaveBeenCalledWith(clean());
        expect(mock).toHaveBeenCalledTimes(3);

        // reset to initial phase
        expect(store.getState().phase).toBe('IDLE');
      });
    });
  });
});

describe('drop', () => {

});

it.skip('should fire a animate drop action is a drop is required', () => {
  const mock = jest.fn();
  const passThrough = () => next => (action) => {
    mock(action);
    next(action);
  };
  const store: Store = createStore(
    passThrough,
    middleware,
  );

  store.dispatch(clean());
  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(bulkReplace(initialBulkReplaceArgs));
  expect(store.getState().phase).toBe('DRAGGING');

  // moving a little bit so that a drop animation will be needed
  store.dispatch(move({
    client: add(initialPublishArgs.client.selection, { x: 1, y: 1 }),
    shouldAnimate: true,
  }));

  mock.mockReset();
  store.dispatch(drop({ reason }));

  expect(mock).toHaveBeenCalledWith(drop({ reason }));
  // not testing the home offset and so on as a part of this test
  expect(mock.mock.calls[1][0].type).toBe('DROP_ANIMATE');
  expect(mock).toHaveBeenCalledTimes(2);

  expect(store.getState().phase).toBe('DROP_ANIMATING');
});
