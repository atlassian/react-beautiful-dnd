// @flow
import type { CompletedDrag } from '../../../../src/types';
import type { Store } from '../../../../src/state/store-types';
import type { DimensionMarshal } from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import middleware from '../../../../src/state/middleware/lift';
import createStore from './util/create-store';
import passThrough from './util/pass-through-middleware';
import { setViewport, resetViewport } from '../../../utils/viewport';
import {
  lift,
  initialPublish,
  animateDrop,
  completeDrop,
  type AnimateDropArgs,
} from '../../../../src/state/action-creators';
import getDimensionMarshal, {
  populateMarshal,
} from '../../../utils/dimension-marshal';
import {
  preset,
  liftArgs,
  initialPublishArgs,
  getCompletedArgs,
} from '../../../utils/preset-action-args';

const getMarshal = (store: Store): DimensionMarshal => {
  const marshal: DimensionMarshal = getDimensionMarshal(store.dispatch);
  populateMarshal(marshal);

  return marshal;
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
    middleware(() => getMarshal(store)),
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
    middleware(() => getMarshal(store)),
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
  expect(mock).toHaveBeenCalledWith(
    completeDrop({ completed, shouldFlush: true }),
  );
  // the new lift continues
  expect(mock).toHaveBeenCalledTimes(3);
});

it('should publish the initial dimensions when lifting', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    middleware(() => getMarshal(store)),
  );

  // first lift is preparing
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(initialPublish(initialPublishArgs));
  expect(mock).toHaveBeenCalledTimes(2);
  expect(store.getState().phase).toBe('DRAGGING');
});
