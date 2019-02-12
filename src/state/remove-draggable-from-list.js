// @flow
import memoizeOne from 'memoize-one';
import type { DraggableDimension } from '../types';

export default memoizeOne(
  (
    remove: DraggableDimension,
    list: DraggableDimension[],
  ): DraggableDimension[] => {
    console.log('CACHE BREAK');
    return list.filter(
      (item: DraggableDimension) => item.descriptor.id !== remove.descriptor.id,
    );
  },
);
