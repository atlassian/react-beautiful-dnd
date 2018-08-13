// @flow
import { patch } from './position';
import getHomeLocation from './get-home-location';
import type {
  Critical,
  DimensionMap,
  ReorderImpact,
  DraggableDimension,
  DroppableDimension,
  Axis,
} from '../types';

export default (
  critical: Critical,
  dimensions: DimensionMap,
): ReorderImpact => {
  const home: DroppableDimension = dimensions.droppables[critical.droppable.id];
  const axis: Axis = home.axis;
  const draggable: DraggableDimension =
    dimensions.draggables[critical.draggable.id];

  return {
    type: 'REORDER',
    movement: {
      displaced: [],
      isBeyondStartPosition: false,
      amount: patch(axis.line, draggable.client.marginBox[axis.size]),
    },
    direction: axis.direction,
    destination: getHomeLocation(critical),
  };
};
