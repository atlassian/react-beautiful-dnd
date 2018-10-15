// @flow
import invariant from 'tiny-invariant';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  DisplacedBy,
  Displacement,
} from '../../../../types';
import type { Instruction } from './move-to-next-index-types';
import getDisplacementMap from '../../../get-displacement-map';
import { addClosest, removeClosest } from '../update-displacement';
import getWillDisplaceForward from '../../../will-displace-forward';
import getDisplacedBy from '../../../get-displaced-by';
import fromReorder from './from-reorder';
import fromCombine from './from-combine';

type IsIncreasingDisplacementArgs = {|
  isInHomeList: boolean,
  isMovingForward: boolean,
  proposedIndex: number,
  startIndexInHome: number,
|};

const getIsIncreasingDisplacement = ({
  isInHomeList,
  isMovingForward,
  proposedIndex,
  startIndexInHome,
}: IsIncreasingDisplacementArgs): boolean => {
  // in foreign list moving forward will reduce the amount displaced
  if (!isInHomeList) {
    return !isMovingForward;
  }

  // increase displacement if moving forward past start
  if (isMovingForward) {
    return proposedIndex > startIndexInHome;
  }
  // increase displacement if moving backwards away from start
  return proposedIndex < startIndexInHome;
};

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
  const instruction: ?Instruction = (() => {
    if (previousImpact.destination) {
      return fromReorder({
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

    return fromCombine({
      isInHomeList,
      isMovingForward,
      draggable,
      destination,
      previousImpact,
      draggables,
      merge: previousImpact.merge,
    });
  })();

  if (instruction == null) {
    return null;
  }

  const { proposedIndex, modifyDisplacement } = instruction;
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

  const displaced: Displacement[] = (() => {
    if (!modifyDisplacement) {
      return previousImpact.movement.displaced;
    }

    const isIncreasingDisplacement: boolean = getIsIncreasingDisplacement({
      isInHomeList,
      isMovingForward,
      proposedIndex,
      startIndexInHome,
    });

    const lastDisplaced: Displacement[] = previousImpact.movement.displaced;
    return isIncreasingDisplacement
      ? addClosest(atProposedIndex, lastDisplaced)
      : removeClosest(lastDisplaced);
  })();

  // console.log('displaced', displaced.map(d => d.draggableId));
  // console.log(
  //   'visibile',
  //   displaced.filter(d => d.isVisible).map(d => d.draggableId),
  // );

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
