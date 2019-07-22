// @flow
import type { Id, DroppableDimension } from '../../../../src/types';
import type {
  Registry,
  DroppableEntry,
} from '../../../../src/state/registry/registry-types';
import createRegistry from '../../../../src/state/registry/create-registry';
import { getPreset } from '../../../utils/dimension';
import { noop } from '../../../../src/empty';

const preset = getPreset();

function getDroppableEntry(
  uniqueId: Id,
  dimension: DroppableDimension,
): DroppableEntry {
  return {
    uniqueId,
    descriptor: dimension.descriptor,
    callbacks: {
      getDimensionAndWatchScroll: () => dimension,
      recollect: () => dimension,
      scroll: noop,
      dragStopped: noop,
    },
  };
}

it('should allow registration', () => {
  const registry: Registry = createRegistry();
  const entry: DroppableEntry = getDroppableEntry('1', preset.home);

  registry.droppable.register(entry);

  expect(registry.droppable.findById(entry.descriptor.id)).toBe(entry);
});

it('should allow unregistration', () => {
  const registry: Registry = createRegistry();
  const entry: DroppableEntry = getDroppableEntry('1', preset.home);

  registry.droppable.register(entry);
  registry.droppable.unregister(entry);

  expect(registry.droppable.findById(entry.descriptor.id)).toBe(null);
});

it('should allow for entry overwriting', () => {
  const registry: Registry = createRegistry();
  const entry1: DroppableEntry = getDroppableEntry('1', preset.home);
  const entry2: DroppableEntry = getDroppableEntry('1', preset.home);

  registry.droppable.register(entry1);
  registry.droppable.register(entry2);

  // overwritten entry 2
  expect(registry.droppable.findById(entry1.descriptor.id)).toBe(entry2);
});

it('should not unregister with an outdated uniqueId', () => {
  const registry: Registry = createRegistry();
  const entry1: DroppableEntry = getDroppableEntry('1', preset.home);
  const entry2: DroppableEntry = getDroppableEntry('2', preset.home);

  registry.droppable.register(entry1);
  // will overwrite with an updated uniqueId
  registry.droppable.register(entry2);

  // overwritten entry1
  expect(registry.droppable.findById(entry1.descriptor.id)).toBe(entry2);

  // entry1 is now outdated, so entry2 won't be removed
  registry.droppable.unregister(entry1);
  expect(registry.droppable.findById(entry1.descriptor.id)).toBe(entry2);
});
