// @flow
import memoizeOne from 'memoize-one';
import type { Displacement, DisplacementMap } from '../types';

export default memoizeOne((displaced: Displacement[]): DisplacementMap =>
  displaced.reduce((map: DisplacementMap, displacement: Displacement) => {
    map[displacement.draggableId] = displacement;
    return map;
  }, {}),
);
