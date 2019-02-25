// @flow
import memoizeOne from 'memoize-one';
import type { DraggableDimension } from '../types';

export default memoizeOne(
  (
    remove: DraggableDimension,
    list: DraggableDimension[],
  ): DraggableDimension[] =>
    list.filter(
      (item: DraggableDimension) => item.descriptor.id !== remove.descriptor.id,
    ),
);
