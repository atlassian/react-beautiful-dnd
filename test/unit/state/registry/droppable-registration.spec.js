// @flow
import type {
  Registry,
  DroppableEntry,
} from '../../../../src/state/registry/registry-types';
import createRegistry from '../../../../src/state/registry/create-registry';
import { getPreset } from '../../../util/dimension';
import { getDroppableEntry } from './util';

const preset = getPreset();

it('should allow registration', () => {
  const registry: Registry = createRegistry();
  const entry: DroppableEntry = getDroppableEntry({
    uniqueId: '1',
    dimension: preset.home,
  });

  registry.droppable.register(entry);

  expect(registry.droppable.findById(entry.descriptor.id)).toBe(entry);
});

it('should allow unregistration', () => {
  const registry: Registry = createRegistry();
  const entry: DroppableEntry = getDroppableEntry({
    uniqueId: '1',
    dimension: preset.home,
  });

  registry.droppable.register(entry);
  registry.droppable.unregister(entry);

  expect(registry.droppable.findById(entry.descriptor.id)).toBe(null);
});

it('should allow for entry overwriting', () => {
  const registry: Registry = createRegistry();
  const entry1: DroppableEntry = getDroppableEntry({
    uniqueId: '1',
    dimension: preset.home,
  });
  const entry2: DroppableEntry = getDroppableEntry({
    uniqueId: '1',
    dimension: preset.home,
  });

  registry.droppable.register(entry1);
  registry.droppable.register(entry2);

  // overwritten entry 2
  expect(registry.droppable.findById(entry1.descriptor.id)).toBe(entry2);
});

it('should not unregister with an outdated uniqueId', () => {
  const registry: Registry = createRegistry();
  const entry1: DroppableEntry = getDroppableEntry({
    uniqueId: '1',
    dimension: preset.home,
  });
  const entry2: DroppableEntry = getDroppableEntry({
    uniqueId: '2',
    dimension: preset.home,
  });

  registry.droppable.register(entry1);
  // will overwrite with an updated uniqueId
  registry.droppable.register(entry2);

  // overwritten entry1
  expect(registry.droppable.findById(entry1.descriptor.id)).toBe(entry2);

  // entry1 is now outdated, so entry2 won't be removed
  registry.droppable.unregister(entry1);
  expect(registry.droppable.findById(entry1.descriptor.id)).toBe(entry2);
});

it('should allow unregistrations when there is no entry', () => {
  const registry: Registry = createRegistry();
  const entry1: DroppableEntry = getDroppableEntry({
    uniqueId: '1',
    dimension: preset.home,
  });

  // no registration
  expect(registry.droppable.findById(entry1.descriptor.id)).toBe(null);

  expect(() => {
    registry.droppable.unregister(entry1);
  }).not.toThrow();
});
