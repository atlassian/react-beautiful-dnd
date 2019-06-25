// @flow
import type {
  CompletedDrag,
  DraggableDimension,
  DimensionMap,
} from '../../../../src/types';
import type { Action, Store } from '../../../../src/state/store-types';
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
  type InitialPublishArgs,
} from '../../../../src/state/action-creators';
import getDimensionMarshal, {
  populateMarshal,
} from '../../../utils/dimension-marshal';
import {
  preset,
  liftArgs,
  initialPublishArgs,
  getCompletedArgs,
  copy,
} from '../../../utils/preset-action-args';

const getMarshal = (dispatch: Action => void): DimensionMarshal => {
  const marshal: DimensionMarshal = getDimensionMarshal(dispatch);
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
    middleware(
      getMarshal((action: Action) => {
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
      getMarshal((action: Action) => {
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
    middleware(
      getMarshal((action: Action) => {
        store.dispatch(action);
      }),
    ),
  );

  // first lift is preparing
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(initialPublish(initialPublishArgs));
  expect(mock).toHaveBeenCalledTimes(2);
  expect(store.getState().phase).toBe('DRAGGING');
});

it('should log a warning if items are added that do not have consecutive indexes', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});

  const mock = jest.fn();
  const customInHome2: DraggableDimension = {
    ...preset.inHome2,
    descriptor: {
      ...preset.inHome2.descriptor,
      index: preset.inHome2.descriptor.index + 1,
    },
  };
  const dimensions: DimensionMap = copy(preset.dimensions);
  dimensions.draggables[preset.inHome2.descriptor.id] = customInHome2;

  const marshal: DimensionMarshal = getDimensionMarshal(action =>
    // lazy use of store.dispatch
    // eslint-disable-next-line no-use-before-define
    store.dispatch(action),
  );
  populateMarshal(marshal, dimensions);
  const store: Store = createStore(passThrough(mock), middleware(marshal));
  const initial: InitialPublishArgs = {
    ...initialPublishArgs,
    dimensions,
  };

  // first lift is preparing
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(initialPublish(initial));
  expect(mock).toHaveBeenCalledTimes(2);
  expect(store.getState().phase).toBe('DRAGGING');

  // a warning is logged
  expect(console.warn).toHaveBeenCalled();
  expect(console.warn.mock.calls[0][0]).toEqual(
    expect.stringContaining('0, [🔥2], [🔥2], 3'),
  );

  console.warn.mockRestore();
});
