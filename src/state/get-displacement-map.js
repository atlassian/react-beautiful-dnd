// @flow
import memoizeOne from 'memoize-one';
import type {
  DraggableId,
  Displacement,
} from '../types';

export type DisplacementMap = { [key: DraggableId]: Displacement }

// shared map creation
// it saves needing to loop over the list in every component
// a really important optimisation for big lists
export default memoizeOne((displaced: Displacement[]): DisplacementMap =>
  displaced.reduce((map: DisplacementMap, displacement: Displacement) => {
    map[displacement.draggableId] = displacement;
    return map;
  }, {}));
