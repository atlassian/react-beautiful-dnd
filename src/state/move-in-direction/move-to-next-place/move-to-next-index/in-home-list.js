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

const getEdge = (
  isMovingTowardStart: boolean,
  isMovingForward: boolean,
): Edge => {
  // is moving away from the start
  if (!isMovingTowardStart) {
    return isMovingForward ? 'end' : 'start';
  }
  // is moving back towards the start
  return isMovingForward ? 'start' : 'end';
};

export default ({
  isMovingForward,
  draggable,
  destination,
  location,
  insideDestination,
}: Args): ?InListResult => {
  const axis: Axis = destination.axis;
  const startIndex: number = draggable.descriptor.index;
  const currentIndex: number = location.index;
  const proposedIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;

  // cannot move forward beyond the last item
  if (proposedIndex > insideDestination.length - 1) {
    return null;
  }

  // cannot move before the first item
  if (proposedIndex < 0) {
    return null;
  }

  const target: DraggableDimension = insideDestination[proposedIndex];
  const isMovingTowardStart =
    (isMovingForward && proposedIndex <= startIndex) ||
    (!isMovingForward && proposedIndex >= startIndex);

  const edge: Edge = getEdge(isMovingTowardStart, isMovingForward);

  const newPageBorderBoxCenter: Position = moveToEdge({
    source: draggable.page.borderBox,
    sourceEdge: edge,
    destination: target.page.borderBox,
    destinationEdge: edge,
    destinationAxis: axis,
  });

  return {
    newPageBorderBoxCenter,
    // increasing displacement when we are moving away from the start
    addToDisplacement: isMovingTowardStart ? null : target,
    isInFrontOfStart: proposedIndex > startIndex,
    proposedIndex,
  };
};
