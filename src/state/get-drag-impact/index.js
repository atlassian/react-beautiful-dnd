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
  Viewport,
} from '../../types';
import getDroppableOver from '../get-droppable-over';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import inHomeList from './in-home-list';
import inForeignList from './in-foreign-list';
import noImpact from '../no-impact';
import withDroppableScroll from '../with-scroll-change/with-droppable-scroll';
import isHomeOf from '../droppable/is-home-of';
import getCombineImpact from './get-combine-impact';

type Args = {|
  pageBorderBoxCenter: Position,
  draggable: DraggableDimension,
  // all dimensions in system
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  previousImpact: DragImpact,
  viewport: Viewport,
  userDirection: UserDirection,
|};

export default ({
  pageBorderBoxCenter,
  draggable,
  draggables,
  droppables,
  previousImpact,
  viewport,
  userDirection,
}: Args): DragImpact => {
  const destinationId: ?DroppableId = getDroppableOver({
    target: pageBorderBoxCenter,
    droppables,
  });

  // not dragging over anything
  if (!destinationId) {
    return noImpact;
  }

  const destination: DroppableDimension = droppables[destinationId];

  if (!destination.isEnabled) {
    return noImpact;
  }

  const isWithinHomeDroppable: boolean = isHomeOf(draggable, destination);
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

  const withMerge: ?DragImpact = getCombineImpact({
    pageBorderBoxCenterWithDroppableScroll,
    previousImpact,
    draggable,
    destination,
    insideDestination,
    userDirection,
  });

  if (withMerge) {
    return withMerge;
  }

  return isWithinHomeDroppable
    ? inHomeList({
        pageBorderBoxCenterWithDroppableScroll,
        draggable,
        home: destination,
        insideHome: insideDestination,
        previousImpact,
        viewport,
        userDirection,
      })
    : inForeignList({
        pageBorderBoxCenterWithDroppableScroll,
        draggable,
        destination,
        insideDestination,
        previousImpact,
        viewport,
        userDirection,
      });
};
