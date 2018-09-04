// @flow
import { type Position } from 'css-box-model';
import moveToEdge from '../../../move-to-edge';
import type { Edge } from '../../../move-to-edge';
import type { InListResult } from './move-to-next-index-types';
import type {
  DraggableLocation,
  DraggableDimension,
  DroppableDimension,
  Axis,
} from '../../../../types';

type Args = {|
  isMovingForward: boolean,
  draggable: DraggableDimension,
  location: DraggableLocation,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
|};

export default ({
  isMovingForward,
  draggable,
  location,
  destination,
  insideDestination,
}: Args): ?InListResult => {
  const axis: Axis = destination.axis;
  const currentIndex: number = location.index;
  const proposedIndex: number = isMovingForward
    ? currentIndex + 1
    : currentIndex - 1;
  const lastIndex: number = insideDestination.length - 1;

  // draggable is allowed to exceed the foreign droppables count by 1
  if (proposedIndex > insideDestination.length) {
    return null;
  }

  // Cannot move before the first item
  if (proposedIndex < 0) {
    return null;
  }

  // Always moving relative to the draggable at the current index
  const movingRelativeTo: DraggableDimension =
    insideDestination[
      // We want to move relative to the proposed index
      // or if we are going beyond to the end of the list - use that index
      Math.min(proposedIndex, lastIndex)
    ];

  const isMovingPastLastIndex: boolean = proposedIndex > lastIndex;
  const sourceEdge: Edge = 'start';

  // moving past the last item
  // in this case we are moving relative to the last item
  // as there is nothing at the proposed index.
  const destinationEdge: Edge = isMovingPastLastIndex ? 'end' : 'start';

  const newPageBorderBoxCenter: Position = moveToEdge({
    source: draggable.page.borderBox,
    sourceEdge,
    destination: movingRelativeTo.page.marginBox,
    destinationEdge,
    destinationAxis: axis,
  });

  return {
    addToDisplacement: isMovingForward ? movingRelativeTo : null,
    newPageBorderBoxCenter,
    isInFrontOfStart: false,
    proposedIndex,
  };
};
