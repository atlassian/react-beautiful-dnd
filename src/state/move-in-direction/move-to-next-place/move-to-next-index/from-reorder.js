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
import type {
  MoveFromResult,
  ChangeDisplacement,
} from './move-to-next-index-types';
import getWillDisplaceForward from '../../../will-displace-forward';

type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
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
  insideDestination: initialInside,
  previousPageBorderBoxCenter,
}: Args): ?MoveFromResult => {
  // not handling movements from a merge
  if (previousImpact.merge) {
    return null;
  }
  const location: ?DraggableLocation = previousImpact.destination;
  invariant(location, 'Cannot move to next index without previous destination');

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

  const willDisplaceForward: boolean = getWillDisplaceForward({
    isInHomeList,
    proposedIndex,
    startIndexInHome,
  });

  const atProposedIndex: DraggableDimension = insideDestination[proposedIndex];

  const isIncreasingDisplacement: boolean = (() => {
    if (isInHomeList) {
      // increase displacement if moving forward past start
      if (isMovingForward) {
        return proposedIndex > startIndexInHome;
      }
      // increase displacement if moving backwards away from start
      return proposedIndex < startIndexInHome;
    }

    // in foreign list moving forward will reduce the amount displaced
    return !isMovingForward;
  })();

  const useDisplacementFrom: DraggableDimension = (() => {
    // Option 1:
    // We need to shift by the amount of the thing we are moving past
    if (isIncreasingDisplacement) {
      return atProposedIndex;
    }
    // Option 2:
    // We are going to undo the last displacement

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

  const change: ChangeDisplacement = isIncreasingDisplacement
    ? {
        type: 'ADD_CLOSEST',
        add: atProposedIndex,
      }
    : {
        type: 'REMOVE_CLOSEST',
      };

  return {
    newPageBorderBoxCenter,
    changeDisplacement: change,
    willDisplaceForward,
    proposedIndex,
  };
};
