// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import { add, patch } from '../../../position';
import type {
  Axis,
  DraggableDimension,
  Displacement,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  DraggableLocation,
} from '../../../../types';
import type { InListResult } from './move-to-next-index-types';
import getWillDisplaceForward from '../../../will-displace-forward';

type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  location: DraggableLocation,
  insideDestination: DraggableDimension[],
  draggables: DraggableDimensionMap,
  previousPageBorderBoxCenter: Position,
|};

export default ({
  isMovingForward,
  isInHomeList,
  previousImpact,
  draggable,
  draggables,
  destination,
  location,
  insideDestination: initialInside,
  previousPageBorderBoxCenter,
}: Args): ?InListResult => {
  const insideDestination: DraggableDimension[] = initialInside.slice();
  const currentIndex: number = location.index;
  const isInForeignList: boolean = !isInHomeList;
  const startIndexInHome: number = draggable.descriptor.index;

  // in foreign list we need to insert the item into the right spot
  if (isInForeignList) {
    insideDestination.splice(location.index, 0, draggable);
  }
  const proposedIndex: number = isMovingForward
    ? currentIndex + 1
    : currentIndex - 1;

  if (proposedIndex < 0) {
    return null;
  }
  if (proposedIndex > insideDestination.length - 1) {
    return null;
  }

  const target: DraggableDimension = insideDestination[proposedIndex];
  const isIncreasingDisplacement: boolean = (() => {
    if (isInHomeList) {
      // if moving away from start then increasing displacement

      return (
        // moving forward from start
        (isMovingForward && proposedIndex > startIndexInHome) ||
        // moving backwards from start
        (!isMovingForward && proposedIndex < startIndexInHome)
      );
    }

    // in foreign list moving forward will reduce the amount displaced
    return !isMovingForward;
  })();

  const willDisplaceForward: boolean = getWillDisplaceForward({
    isInHomeList,
    proposedIndex,
    startIndexInHome,
  });

  const useDisplacementFrom: DraggableDimension = (() => {
    if (isIncreasingDisplacement) {
      return target;
    }
    // displacement is ordered by closest impacted
    const displacement: ?Displacement = previousImpact.movement.displaced[0];

    invariant(
      displacement,
      'Cannot move relative to last displacement when there is no previous displacement',
    );

    return draggables[displacement.draggableId];
  })();

  const modifier: number = isMovingForward ? 1 : -1;
  const axis: Axis = destination.axis;
  const shift: Position = patch(
    axis.line,
    useDisplacementFrom.displaceBy[axis.line] * modifier,
  );

  const newPageBorderBoxCenter: Position = add(
    previousPageBorderBoxCenter,
    shift,
  );

  return {
    newPageBorderBoxCenter,
    addToDisplacement: isIncreasingDisplacement ? target : null,
    willDisplaceForward,
    proposedIndex,
  };
};
