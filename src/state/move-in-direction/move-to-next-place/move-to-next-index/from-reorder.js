// @flow
import invariant from 'tiny-invariant';
import type {
  Axis,
  DisplacedBy,
  DraggableDimension,
  Displacement,
  DroppableDimension,
  DragImpact,
  DraggableLocation,
} from '../../../../types';
import getWillDisplaceForward from '../../../will-displace-forward';
import getDisplacementMap from '../../../get-displacement-map';
import getDisplacedBy from '../../../get-displaced-by';
import { addClosest, removeClosest } from '../update-displacement';

type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
|};

export default ({
  isMovingForward,
  isInHomeList,
  previousImpact,
  draggable,
  destination,
  insideDestination: initialInside,
}: Args): ?DragImpact => {
  if (previousImpact.merge) {
    return null;
  }
  const location: ?DraggableLocation = previousImpact.destination;
  invariant(location, 'Cannot move to next index without previous destination');

  const axis: Axis = destination.axis;
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
  const displacedBy: DisplacedBy = getDisplacedBy(
    axis,
    draggable.displaceBy,
    willDisplaceForward,
  );

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

  const lastDisplaced: Displacement[] = previousImpact.movement.displaced;
  const displaced: Displacement[] = isIncreasingDisplacement
    ? addClosest(atProposedIndex, lastDisplaced)
    : removeClosest(lastDisplaced);

  return {
    movement: {
      displacedBy,
      willDisplaceForward,
      displaced,
      map: getDisplacementMap(displaced),
    },
    direction: axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: proposedIndex,
    },
    merge: null,
  };
};
