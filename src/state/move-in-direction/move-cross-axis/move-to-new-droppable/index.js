// @flow
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import type { InternalResult } from '../../move-in-direction-types';
import type {
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Viewport,
  DraggableDimensionMap,
} from '../../../../types';
import getPageBorderBoxCenterFromImpact from '../../../get-center-from-impact/get-page-border-box-center';
import toHomeList from './to-home-list';
import toForeignList from './to-foreign-list';
import isHomeOf from '../../../droppable/is-home-of';

type Args = {|
  // the current center position of the draggable
  previousPageBorderBoxCenter: Position,
  // the draggable that is dragging and needs to move
  draggable: DraggableDimension,
  // what the draggable is moving towards
  // can be null if the destination is empty
  moveRelativeTo: ?DraggableDimension,
  // the droppable the draggable is moving to
  destination: DroppableDimension,
  // all the draggables inside the destination
  insideDestination: DraggableDimension[],
  // the impact of a previous drag,
  previousImpact: DragImpact,
  // the viewport
  viewport: Viewport,
  draggables: DraggableDimensionMap,
|};

export default ({
  previousPageBorderBoxCenter,
  destination,
  insideDestination,
  draggable,
  draggables,
  moveRelativeTo,
  previousImpact,
  viewport,
}: Args): ?InternalResult => {
  // Draggables available, but none are candidates for movement (eg none are visible)
  // Cannot move into the list
  // Note: can move to empty list and then !moveRelativeTo && !insideDestination.length
  if (insideDestination.length && !moveRelativeTo) {
    return null;
  }

  if (moveRelativeTo) {
    invariant(
      moveRelativeTo.descriptor.droppableId === destination.descriptor.id,
      'Unable to find target in destination droppable',
    );
  }

  const isMovingToHome: boolean = isHomeOf(draggable, destination);

  const impact: ?DragImpact = isMovingToHome
    ? toHomeList({
        moveIntoIndexOf: moveRelativeTo,
        insideDestination,
        draggable,
        destination,
        previousImpact,
        viewport,
      })
    : toForeignList({
        previousPageBorderBoxCenter,
        moveRelativeTo,
        insideDestination,
        draggable,
        draggables,
        destination,
        previousImpact,
        viewport,
      });

  if (!impact) {
    return null;
  }

  const pageBorderBoxCenter: Position = getPageBorderBoxCenterFromImpact({
    impact,
    draggable,
    droppable: destination,
    draggables,
  });

  // No additional visibility checks required
  return {
    type: 'MOVE_CROSS_AXIS',
    pageBorderBoxCenter,
    impact,
    destination,
  };
};
