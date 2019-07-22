// @flow
import type {
  Registry,
  DraggableEntry,
} from '../../../../src/state/registry/registry-types';
import createRegistry from '../../../../src/state/registry/create-registry';
import { getPreset } from '../../../utils/dimension';
import { getDraggableEntry } from './util';

const preset = getPreset();

it('should allow adding event listeners', () => {
  const listener1 = jest.fn();
  const listener2 = jest.fn();
  const registry: Registry = createRegistry();

  registry.subscribe(listener1);
  registry.subscribe(listener2);

  const entry: DraggableEntry = getDraggableEntry({
    uniqueId: '1',
    dimension: preset.inHome1,
  });
  registry.draggable.register(entry);

  expect(listener1).toHaveBeenCalledWith({ type: 'ADDITION', value: entry });
  expect(listener2).toHaveBeenCalledWith({ type: 'ADDITION', value: entry });
});

it('should allow removing event listeners', () => {
  const toBeRemoved = jest.fn();
  const persistent = jest.fn();
  const registry: Registry = createRegistry();

  const unsubscribe = registry.subscribe(toBeRemoved);
  registry.subscribe(persistent);

  unsubscribe();

  const entry: DraggableEntry = getDraggableEntry({
    uniqueId: '1',
    dimension: preset.inHome1,
  });
  registry.draggable.register(entry);

  expect(toBeRemoved).not.toHaveBeenCalled();
  expect(persistent).toHaveBeenCalledWith({ type: 'ADDITION', value: entry });
});

it('should not error on a double unsubscribe', () => {
  const toBeRemoved = jest.fn();
  const persistent = jest.fn();
  const registry: Registry = createRegistry();

  const unsubscribe = registry.subscribe(toBeRemoved);
  registry.subscribe(persistent);

  unsubscribe();
  unsubscribe();
  unsubscribe();

  const entry: DraggableEntry = getDraggableEntry({
    uniqueId: '1',
    dimension: preset.inHome1,
  });
  registry.draggable.register(entry);

  // not called
  expect(toBeRemoved).not.toHaveBeenCalled();
  // unaffected
  expect(persistent).toHaveBeenCalledWith({ type: 'ADDITION', value: entry });
});
