// @flow
import getHomeLocation from './get-home-location';
import { noMovement } from './no-impact';
import type {
  Critical,
  DimensionMap,
  DroppableDimension,
  DragImpact,
  Axis,
} from '../types';

export default (critical: Critical, dimensions: DimensionMap): DragImpact => {
  const home: DroppableDimension = dimensions.droppables[critical.droppable.id];
  const axis: Axis = home.axis;

  return {
    movement: noMovement,
    direction: axis.direction,
    destination: getHomeLocation(critical),
    group: null,
  };
};
