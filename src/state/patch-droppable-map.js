// @flow
import type { DroppableDimension, DimensionMap } from '../../../../types';

export default (
  dimensions: DimensionMap,
  updated: DroppableDimension,
): DimensionMap => ({
  ...dimensions,
  droppables: {
    ...dimensions.droppables,
    [updated.descriptor.id]: updated,
  },
});
