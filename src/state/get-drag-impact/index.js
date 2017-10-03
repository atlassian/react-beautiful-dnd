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
  previousDroppableOver: ?DroppableId,
|}

export default ({
  pageCenter,
  draggable,
  draggables,
  droppables,
  previousDroppableOver,
}: Args): DragImpact => {
  const destinationId: ?DroppableId = getDroppableOver({
    target: pageCenter,
    draggable,
    droppables,
    previousDroppableOver,
  });

  // not dragging over anything
  if (!destinationId) {
    return noImpact;
  }

  const destination: DroppableDimension = droppables[destinationId];

  if (!destination.isEnabled) {
    return noImpact;
  }

  const home: DroppableDimension = droppables[draggable.droppableId];
  const isWithinHomeDroppable: boolean = home.id === destinationId;
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
    });
  }

  return inForeignList({
    pageCenter,
    draggable,
    destination,
    insideDestination,
  });
};
