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
  OnLift,
} from '../../types';
import getDroppableOver from '../get-droppable-over';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import withDroppableScroll from '../with-scroll-change/with-droppable-scroll';
import getCombineImpact from './get-combine-impact';
import getReorderImpact from './get-reorder-impact';
import noImpact from '../no-impact';
import removeDraggableFromList from '../remove-draggable-from-list';

type Args = {|
  pageBorderBoxCenter: Position,
  draggable: DraggableDimension,
  // all dimensions in system
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  previousImpact: DragImpact,
  viewport: Viewport,
  userDirection: UserDirection,
  onLift: OnLift,
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
    // A big design decision was made here to collapse the home list
    // when not over any list. This yielded the most consistently beautiful experience.
    return noImpact;
  }

  const destination: DroppableDimension = droppables[destinationId];
  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination.descriptor.id,
    draggables,
  );
  // const insideDestinationWithoutDraggable: DraggableDimension[] = removeDraggableFromList(
  //   draggable,
  //   insideDestination,
  // );
  // Where the element actually is now.
  // Need to take into account the change of scroll in the droppable
  const pageBorderBoxCenterWithDroppableScrollChange: Position = withDroppableScroll(
    destination,
    pageBorderBoxCenter,
  );

  // checking combine first so we combine before any reordering
  // const withMerge: ?DragImpact = getCombineImpact({
  //   pageBorderBoxCenterWithDroppableScrollChange,
  //   previousImpact,
  //   destination,
  //   insideDestinationWithoutDraggable,
  //   userDirection,
  //   onLift,
  // });

  // if (withMerge) {
  //   return withMerge;
  // }

  return getReorderImpact({
    pageBorderBoxCenterWithDroppableScrollChange,
    draggable,
    destination,
    insideDestination,
    last: previousImpact.displaced,
    viewport,
    userDirection,
  });
};
