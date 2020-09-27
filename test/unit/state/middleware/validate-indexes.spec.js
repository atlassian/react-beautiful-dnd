// @flow
import type { DraggableDimension, DimensionMap } from '../../../../src/types';
import type { Store } from '../../../../src/state/store-types';
import type { DimensionMarshal } from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import {
  flush,
  initialPublish,
  type InitialPublishArgs,
  lift,
  beforeInitialCapture,
} from '../../../../src/state/action-creators';
import middleware from '../../../../src/state/middleware/lift';
import createRegistry from '../../../../src/state/registry/create-registry';
import { createMarshal } from '../../../util/dimension-marshal';
import {
  copy,
  initialPublishArgs,
  beforeCaptureArgs,
  liftArgs,
  preset,
} from '../../../util/preset-action-args';
import { populate } from '../../../util/registry';
import { resetViewport, setViewport } from '../../../util/viewport';
import createStore from './util/create-store';
import passThrough from './util/pass-through-middleware';
import type { Registry } from '../../../../src/state/registry/registry-types';

const getPopulatedRegistry = (dimensions?: DimensionMap): Registry => {
  const registry: Registry = createRegistry();
  populate(registry, dimensions);
  return registry;
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

it('should log a warning if items are added that do not have consecutive indexes', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const mock = jest.fn();
  const customInHome2: DraggableDimension = {
    ...preset.inHome2,
    descriptor: {
      ...preset.inHome2.descriptor,
      index: preset.inHome2.descriptor.index + 5,
    },
  };
  const copied: DimensionMap = copy(preset.dimensions);
  copied.draggables[preset.inHome2.descriptor.id] = customInHome2;

  const marshal: DimensionMarshal = createMarshal(
    getPopulatedRegistry(copied),
    // lazy use of store.dispatch
    (action) =>
      // eslint-disable-next-line no-use-before-define
      store.dispatch(action),
  );
  const store: Store = createStore(passThrough(mock), middleware(marshal));
  const initial: InitialPublishArgs = {
    ...initialPublishArgs,
    dimensions: copied,
  };

  // first lift is preparing
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(flush());
  expect(mock).toHaveBeenCalledWith(beforeInitialCapture(beforeCaptureArgs));
  expect(mock).toHaveBeenCalledWith(initialPublish(initial));
  expect(mock).toHaveBeenCalledTimes(4);
  expect(store.getState().phase).toBe('DRAGGING');

  // a warning is logged
  expect(warn).toHaveBeenCalled();
  expect(warn.mock.calls[0][0]).toEqual(
    // dimensions will be ordered by index
    // inHome1: index 0: all good
    // inHome3: index 2: boom
    // inHome4: index 3: all good (2 + 1)
    // inHome2: index 6: boom
    expect.stringContaining(`0, [🔥2], 3, [🔥6]`),
  );

  warn.mockRestore();
});

it('should log a warning if items are added have duplicate indexes', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const mock = jest.fn();
  const customInHome4: DraggableDimension = {
    ...preset.inHome4,
    descriptor: {
      ...preset.inHome4.descriptor,
      // duplicate index
      index: preset.inHome3.descriptor.index,
    },
  };
  const dimensions: DimensionMap = copy(preset.dimensions);
  dimensions.draggables[preset.inHome4.descriptor.id] = customInHome4;

  const marshal: DimensionMarshal = createMarshal(
    getPopulatedRegistry(dimensions),
    // lazy use of store.dispatch
    (action) =>
      // eslint-disable-next-line no-use-before-define
      store.dispatch(action),
  );
  const store: Store = createStore(passThrough(mock), middleware(marshal));
  const initial: InitialPublishArgs = {
    ...initialPublishArgs,
    dimensions,
  };

  // first lift is preparing
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(flush());
  expect(mock).toHaveBeenCalledWith(beforeInitialCapture(beforeCaptureArgs));
  expect(mock).toHaveBeenCalledWith(initialPublish(initial));
  expect(mock).toHaveBeenCalledTimes(4);
  expect(store.getState().phase).toBe('DRAGGING');

  // a warning is logged
  expect(warn).toHaveBeenCalled();
  expect(warn.mock.calls[0][0]).toEqual(
    expect.stringContaining('0, 1, [🔥2], [🔥2]'),
  );

  warn.mockRestore();
});
