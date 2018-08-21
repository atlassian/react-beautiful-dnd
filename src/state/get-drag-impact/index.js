// @flow
import { type Position } from 'css-box-model';
import type {
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  UserDirection,
  DragImpact,
  GroupingImpact,
  Viewport,
} from '../../types';
import getDroppableOver from '../get-droppable-over';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import inHomeList from './in-home-list';
import inForeignList from './in-foreign-list';
import getGroupingImpact from './get-grouping-impact';
import noImpact from '../no-impact';
import withDroppableScroll from '../with-droppable-scroll';

type Args = {|
  pageBorderBoxCenter: Position,
  draggable: DraggableDimension,
  // all dimensions in system
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  previousImpact: DragImpact,
  viewport: Viewport,
  direction: UserDirection,
|};

export default ({
  pageBorderBoxCenter,
  draggable,
  draggables,
  droppables,
  previousImpact,
  viewport,
  direction,
}: Args): DragImpact => {
  const previousDroppableOverId: ?DroppableId = previousImpact.destination
    ? previousImpact.destination.droppableId
    : null;

  const destinationId: ?DroppableId = getDroppableOver({
    target: pageBorderBoxCenter,
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

  const isWithinHomeDroppable: boolean =
    draggable.descriptor.droppableId === destinationId;
  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );
  // Where the element actually is now.
  // Need to take into account the change of scroll in the droppable
  const pageBorderBoxCenterWithDroppableScroll: Position = withDroppableScroll(
    destination,
    pageBorderBoxCenter,
  );

  const group: ?GroupingImpact = getGroupingImpact({
    pageBorderBoxCenterWithDroppableScroll,
    previous: previousImpact.group,
    draggable,
    destination,
    insideDestination,
    direction,
  });

  // If there is a grouping impact then the displacement
  // cannot change
  // TODO: what if entering a new list?
  if (group) {
    const withGroup: DragImpact = {
      ...previousImpact,
      group,
    };
    return withGroup;
  }

  return isWithinHomeDroppable
    ? inHomeList({
        pageBorderBoxCenterWithDroppableScroll,
        draggable,
        home: destination,
        insideHome: insideDestination,
        previousImpact,
        viewport,
        direction,
      })
    : inForeignList({
        pageBorderBoxCenterWithDroppableScroll,
        draggable,
        destination,
        insideDestination,
        previousImpact,
        viewport,
        direction,
      });
};
