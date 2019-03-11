// @flow
import type { DroppableDimension, DroppableDimensionMap } from '../types';

export default (
  droppables: DroppableDimensionMap,
  updated: DroppableDimension,
): DroppableDimensionMap => ({
  ...droppables,
  [updated.descriptor.id]: updated,
});
