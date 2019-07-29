// @flow
import type {
  Registry,
  DraggableEntry,
} from '../../../../src/state/registry/registry-types';
import createRegistry from '../../../../src/state/registry/create-registry';
import { getPreset } from '../../../utils/dimension';
import { getDraggableEntry, getDroppableEntry } from './util';

const preset = getPreset();

it('should remove any registrations', () => {
  const registry: Registry = createRegistry();

  registry.draggable.register(
    getDraggableEntry({ uniqueId: '1', dimension: preset.inHome1 }),
  );
  registry.droppable.register(
    getDroppableEntry({ uniqueId: '1', dimension: preset.home }),
  );
  expect(registry.draggable.exists(preset.inHome1.descriptor.id)).toBe(true);
  expect(registry.droppable.exists(preset.home.descriptor.id)).toBe(true);

  registry.clean();

  // now cannot find entries
  expect(registry.draggable.exists(preset.inHome1.descriptor.id)).toBe(false);
  expect(registry.droppable.exists(preset.home.descriptor.id)).toBe(false);
});

it('should remove unsubscribe any event listeners', () => {
  const listener1 = jest.fn();
  const listener2 = jest.fn();
  const registry: Registry = createRegistry();

  const unsubscribe1 = registry.subscribe(listener1);
  const unsubscribe2 = registry.subscribe(listener2);

  registry.clean();

  const entry: DraggableEntry = getDraggableEntry({
    uniqueId: '1',
    dimension: preset.inHome1,
  });
  registry.draggable.register(entry);

  expect(listener1).not.toHaveBeenCalled();
  expect(listener2).not.toHaveBeenCalled();

  // manually unsubscribing does nothing and does not throw
  expect(() => {
    unsubscribe1();
    unsubscribe2();
  }).not.toThrow();
});
