// @flow
import type { CompletedDrag, DimensionMap } from '../../../../src/types';
import type { Action, Store } from '../../../../src/state/store-types';
import type { DimensionMarshal } from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import middleware from '../../../../src/state/middleware/lift';
import createStore from './util/create-store';
import passThrough from './util/pass-through-middleware';
import { setViewport, resetViewport } from '../../../util/viewport';
import {
  lift,
  initialPublish,
  animateDrop,
  completeDrop,
  type AnimateDropArgs,
  flush,
} from '../../../../src/state/action-creators';
import { createMarshal } from '../../../util/dimension-marshal';
import {
  preset,
  liftArgs,
  initialPublishArgs,
  getCompletedArgs,
} from '../../../util/preset-action-args';
import { populate } from '../../../util/registry';
import type { Registry } from '../../../../src/state/registry/registry-types';
import createRegistry from '../../../../src/state/registry/create-registry';

const getPopulatedRegistry = (dimensions?: DimensionMap): Registry => {
  const registry: Registry = createRegistry();
  populate(registry, dimensions);
  return registry;
};

const getBasicMarshal = (dispatch: Action => void): DimensionMarshal => {
  return createMarshal(getPopulatedRegistry(), dispatch);
};

beforeEach(() => {
  setViewport(preset.viewport);
  jest.useFakeTimers();
});

afterEach(() => {
  resetViewport();
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('should throw if a drag cannot be started when a lift action occurs', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    middleware(
      getBasicMarshal((action: Action) => {
        store.dispatch(action);
      }),
    ),
  );

  // first lift is all good
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  expect(store.getState().phase).toBe('DRAGGING');

  // a lift is not permitted in the DRAGGING phase
  expect(() => store.dispatch(lift(liftArgs))).toThrow();
});

it('should flush any animating drops', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    middleware(
      getBasicMarshal((action: Action) => {
        store.dispatch(action);
      }),
    ),
  );

  // start a drag
  store.dispatch(initialPublish(initialPublishArgs));
  expect(store.getState().phase).toBe('DRAGGING');

  const completed: CompletedDrag = getCompletedArgs('DROP').completed;

  // start a drop
  const args: AnimateDropArgs = {
    newHomeClientOffset: { x: -1, y: -1 },
    dropDuration: 1,
    completed,
  };
  store.dispatch(animateDrop(args));
  expect(store.getState().phase).toBe('DROP_ANIMATING');

  // while drop animating a lift occurs
  mock.mockReset();
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  // the previous drag is flushed
  expect(mock).toHaveBeenCalledWith(completeDrop({ completed }));
  // any animations are flushed
  expect(mock).toHaveBeenCalledWith(flush());
  // the new lift continues
  expect(mock).toHaveBeenCalledTimes(4);
});

it('should publish the initial dimensions when lifting', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    middleware(
      getBasicMarshal((action: Action) => {
        store.dispatch(action);
      }),
    ),
  );

  // first lift is preparing
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  // last drag flushed
  expect(mock).toHaveBeenCalledWith(flush());
  expect(mock).toHaveBeenCalledWith(initialPublish(initialPublishArgs));
  expect(mock).toHaveBeenCalledTimes(3);
  expect(store.getState().phase).toBe('DRAGGING');
});
