// @flow
import invariant from 'tiny-invariant';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  DisplacedBy,
  Displacement,
} from '../../../../../types';
import getNextIndexFromReorder from './get-next-index-from-reorder';
import getNextIndexFromCombine from './get-next-index-from-combine';
import getDisplacementMap from '../../../../get-displacement-map';
import { addClosest, removeClosest } from '../../update-displacement';
import getWillDisplaceForward from '../../../../will-displace-forward';
import getDisplacedBy from '../../../../get-displaced-by';

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  draggables,
  destination,
  insideDestination,
  previousImpact,
}: Args) => {
  const proposedIndex: ?number = (() => {
    if (previousImpact.destination) {
      return getNextIndexFromReorder({
        isMovingForward,
        isInHomeList,
        draggable,
        previousImpact,
        insideDestination,
      });
    }

    invariant(
      previousImpact.merge,
      'Cannot move to next spot without a destination or merge',
    );

    return getNextIndexFromCombine({
      isInHomeList,
      isMovingForward,
      draggable,
      destination,
      previousImpact,
      draggables,
      merge: previousImpact.merge,
    });
  })();

  console.warn('proposed index', proposedIndex);

  if (proposedIndex == null) {
    return null;
  }

  const startIndexInHome: number = draggable.descriptor.index;
  const willDisplaceForward: boolean = getWillDisplaceForward({
    isInHomeList,
    proposedIndex,
    startIndexInHome,
  });
  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
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

  const displaced: Displacement[] = (() => {
    // TODO: there are some cases where we do not want to update the displacement

    const lastDisplaced: Displacement[] = previousImpact.movement.displaced;
    const updated: Displacement[] = isIncreasingDisplacement
      ? addClosest(atProposedIndex, lastDisplaced)
      : removeClosest(lastDisplaced);

    return updated;
  })();

  console.log('displaced', displaced.map(d => d.draggableId));
  console.log(
    'visibile',
    displaced.filter(d => d.isVisible).map(d => d.draggableId),
  );

  return {
    movement: {
      displacedBy,
      willDisplaceForward,
      displaced,
      map: getDisplacementMap(displaced),
    },
    direction: destination.axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: proposedIndex,
    },
    merge: null,
  };
};
