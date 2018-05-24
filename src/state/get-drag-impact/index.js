// @flow
import { type Position } from 'css-box-model';
import type {
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DragImpact,
  Viewport,
} from '../../types';
import getDroppableOver from '../get-droppable-over';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import noImpact from '../no-impact';
import inHomeList from './in-home-list';
import inForeignList from './in-foreign-list';

type Args = {|
  pageBorderBoxCenter: Position,
  draggable: DraggableDimension,
  // all dimensions in system
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  previousImpact: DragImpact,
  viewport: Viewport,
|}

export default ({
  pageBorderBoxCenter,
  draggable,
  draggables,
  droppables,
  previousImpact,
  viewport,
}: Args): DragImpact => {
  const previousDroppableOverId: ?DroppableId =
    previousImpact.destination &&
    previousImpact.destination.droppableId;

  const destinationId: ?DroppableId = getDroppableOver({
    target: pageBorderBoxCenter,
    draggable,
    draggables,
    droppables,
    previousDroppableOverId,
  });

  console.log('destinationId', destinationId);

  // not dragging over anything
  if (!destinationId) {
    return noImpact;
  }

  const destination: DroppableDimension = droppables[destinationId];

  if (!destination.isEnabled) {
    return noImpact;
  }

  const home: DroppableDimension = droppables[draggable.descriptor.droppableId];
  const isWithinHomeDroppable: boolean = home.descriptor.id === destinationId;
  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );

  if (isWithinHomeDroppable) {
    return inHomeList({
      pageBorderBoxCenter,
      draggable,
      home,
      insideHome: insideDestination,
      previousImpact: previousImpact || noImpact,
      viewport,
    });
  }

  return inForeignList({
    pageBorderBoxCenter,
    draggable,
    destination,
    insideDestination,
    previousImpact: previousImpact || noImpact,
    viewport,
  });
};
