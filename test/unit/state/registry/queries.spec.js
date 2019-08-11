// @flow
import type {
  Registry,
  DraggableEntry,
  DroppableEntry,
} from '../../../../src/state/registry/registry-types';
import createRegistry from '../../../../src/state/registry/create-registry';
import { getPreset } from '../../../util/dimension';
import { getDraggableEntry, getDroppableEntry } from './util';

const preset = getPreset();

describe('draggable', () => {
  const registry: Registry = createRegistry();
  const inHome1: DraggableEntry = getDraggableEntry({
    uniqueId: '1',
    dimension: preset.inHome1,
  });
  const inHome2: DraggableEntry = getDraggableEntry({
    uniqueId: '2',
    dimension: preset.inHome2,
  });
  const ofAnotherType: DraggableEntry = getDraggableEntry({
    uniqueId: '3',
    dimension: {
      ...preset.inHome3,
      descriptor: {
        id: 'of another type',
        type: 'some other type',
        index: 1,
        droppableId: 'some other droppable id',
      },
    },
  });
  [inHome1, inHome2, ofAnotherType].forEach((entry: DraggableEntry) => {
    registry.draggable.register(entry);
  });

  describe('getById', () => {
    it('should return an item', () => {
      expect(registry.draggable.getById(preset.inHome1.descriptor.id)).toBe(
        inHome1,
      );
    });
    it('should throw if no item exists', () => {
      expect(() => registry.draggable.getById('some unknown id')).toThrow();
    });
  });
  describe('findById', () => {
    it('should return an item if it exists', () => {
      expect(registry.draggable.findById(preset.inHome1.descriptor.id)).toBe(
        inHome1,
      );
    });
    it('should return null if an item does not exist', () => {
      expect(registry.draggable.findById('unknown id')).toBe(null);
    });
  });
  describe('exists', () => {
    it('should return true if an item exists', () => {
      expect(registry.draggable.exists(preset.inHome1.descriptor.id)).toBe(
        true,
      );
    });
    it('should return null if an item does not exist', () => {
      expect(registry.draggable.exists('unknown id')).toBe(false);
    });
  });
  describe('getAllByType', () => {
    it('should only return items of the correct type', () => {
      expect(
        registry.draggable.getAllByType(preset.inHome1.descriptor.type),
      ).toEqual([inHome1, inHome2]);
    });
  });
});

describe('droppable', () => {
  const registry: Registry = createRegistry();
  const home: DroppableEntry = getDroppableEntry({
    uniqueId: '1',
    dimension: preset.home,
  });
  const foreign: DroppableEntry = getDroppableEntry({
    uniqueId: '2',
    dimension: preset.foreign,
  });
  const ofAnotherType: DroppableEntry = getDroppableEntry({
    uniqueId: '3',
    dimension: {
      ...preset.foreign,
      descriptor: {
        id: 'of another type',
        type: 'some other type',
        mode: 'STANDARD',
      },
    },
  });
  [home, foreign, ofAnotherType].forEach((entry: DroppableEntry) => {
    registry.droppable.register(entry);
  });

  describe('getById', () => {
    it('should return an item', () => {
      expect(registry.droppable.getById(preset.home.descriptor.id)).toBe(home);
    });
    it('should throw if no item exists', () => {
      expect(() => registry.droppable.getById('some unknown id')).toThrow();
    });
  });
  describe('findById', () => {
    it('should return an item if it exists', () => {
      expect(registry.droppable.findById(preset.home.descriptor.id)).toBe(home);
    });
    it('should return null if an item does not exist', () => {
      expect(registry.droppable.findById('unknown id')).toBe(null);
    });
  });
  describe('exists', () => {
    it('should return true if an item exists', () => {
      expect(registry.droppable.exists(preset.home.descriptor.id)).toBe(true);
    });
    it('should return null if an item does not exist', () => {
      expect(registry.droppable.exists('unknown id')).toBe(false);
    });
  });
  describe('getAllByType', () => {
    it('should only return items of the correct type', () => {
      expect(
        registry.droppable.getAllByType(preset.home.descriptor.type),
      ).toEqual([home, foreign]);
    });
  });
});
