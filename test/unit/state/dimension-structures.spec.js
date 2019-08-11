// @flow
import {
  toDraggableList,
  toDraggableMap,
  toDroppableMap,
  toDroppableList,
} from '../../../src/state/dimension-structures';
import { getPreset } from '../../util/dimension';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
} from '../../../src/types';

const preset = getPreset();

const draggables: DraggableDimension[] = [preset.inHome1, preset.inHome2];
const droppables: DroppableDimension[] = [preset.home, preset.foreign];

const draggableMap: DraggableDimensionMap = {
  [preset.inHome1.descriptor.id]: preset.inHome1,
  [preset.inHome2.descriptor.id]: preset.inHome2,
};

const droppableMap: DroppableDimensionMap = {
  [preset.home.descriptor.id]: preset.home,
  [preset.foreign.descriptor.id]: preset.foreign,
};

it('should convert a draggable list to a map', () => {
  expect(toDraggableMap(draggables)).toEqual(draggableMap);
});

it('should convert a droppable list to a map', () => {
  expect(toDroppableMap(droppables)).toEqual(droppableMap);
});

it('should convert a draggable map to a list', () => {
  expect(toDraggableList(draggableMap)).toEqual(draggables);
});

it('should convert a droppable map to a list', () => {
  expect(toDroppableList(droppableMap)).toEqual(droppables);
});
