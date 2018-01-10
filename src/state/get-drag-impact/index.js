// @flow
import type {
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DragImpact,
  Position,
} from '../../types';
import getDroppableOver from '../get-droppable-over';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import noImpact from '../no-impact';
import inHomeList from './in-home-list';
import inForeignList from './in-foreign-list';

type Args = {|
  pageCenter: Position,
  draggable: DraggableDimension,
  // all dimensions in system
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  previousImpact: DragImpact,
|}

export default ({
  pageCenter,
  draggable,
  draggables,
  droppables,
  previousImpact,
}: Args): DragImpact => {
  const previousDroppableOverId: ?DroppableId =
    previousImpact.destination &&
    previousImpact.destination.droppableId;

  const destinationId: ?DroppableId = getDroppableOver({
    target: pageCenter,
    draggable,
    draggables,
    droppables,
    previousDroppableOverId,
  });

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
      pageCenter,
      draggable,
      home,
      insideHome: insideDestination,
      previousImpact: previousImpact || noImpact,
    });
  }

  return inForeignList({
    pageCenter,
    draggable,
    destination,
    insideDestination,
    previousImpact: previousImpact || noImpact,
  });
};
