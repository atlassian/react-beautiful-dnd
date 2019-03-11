// @flow
import type { DimensionMap, DroppableDimension } from '../types';
import patchDroppableMap from './patch-droppable-map';

export default (
  dimensions: DimensionMap,
  updated: DroppableDimension,
): DimensionMap => ({
  draggables: dimensions.draggables,
  droppables: patchDroppableMap(dimensions.droppables, updated),
});
