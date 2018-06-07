// @flow
import { patch } from './position';
import type {
  Critical,
  DimensionMap,
  DraggableDimension,
  DroppableDimension,
  Axis,
} from '../types';

export default (critical: Critical, dimensions: DimensionMap) => {
  const home: DroppableDimension = dimensions.droppables[critical.droppable.id];
  const axis: Axis = home.axis;
  const draggable: DraggableDimension = dimensions.draggables[critical.draggable.id];

  return {
    movement: {
      displaced: [],
      isBeyondStartPosition: false,
      amount: patch(axis.line, draggable.client.marginBox[axis.size]),
    },
    direction: axis.direction,
    destination: {
      index: critical.draggable.index,
      droppableId: critical.droppable.id,
    },
  };
};

