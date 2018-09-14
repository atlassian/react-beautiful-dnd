// @flow
import getHomeLocation from './get-home-location';
import { noMovement } from './no-impact';
import type {
  DraggableDimension,
  DroppableDimension,
  DragImpact,
} from '../types';

export default (
  draggable: DraggableDimension,
  home: DroppableDimension,
): DragImpact => ({
  movement: noMovement,
  direction: home.axis.direction,
  destination: getHomeLocation(draggable.descriptor),
  merge: null,
});
