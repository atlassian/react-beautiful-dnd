// @flow
import { patch } from './position';
import getHomeLocation from './get-home-location';
import type {
  Critical,
  DimensionMap,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
} from '../types';

export default (critical: Critical, dimensions: DimensionMap): DragImpact => {
  const home: DroppableDimension = dimensions.droppables[critical.droppable.id];
  const axis: Axis = home.axis;
  const draggable: DraggableDimension =
    dimensions.draggables[critical.draggable.id];

  return {
    movement: {
      displaced: [],
      map: {},
      isBeyondStartPosition: false,
      amount: patch(axis.line, draggable.client.marginBox[axis.size]),
    },
    direction: axis.direction,
    destination: getHomeLocation(critical),
    group: null,
  };
};
