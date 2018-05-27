// @flow
import type {
  Critical,
  DroppableDimension,
  DroppableDimensionMap,
} from '../types';
import { noMovement } from './no-impact';

export default (critical: Critical, droppables: DroppableDimensionMap) => {
  const home: DroppableDimension = droppables[critical.droppable.id];

  return {
    movement: noMovement,
    direction: home.axis.direction,
    destination: {
      index: critical.draggable.index,
      droppableId: critical.droppable.id,
    },
  };
};

