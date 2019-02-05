// @flow
import invariant from 'tiny-invariant';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  DisplacedBy,
  Displacement,
  OnLift,
} from '../../../../types';
import type { Instruction } from './move-to-next-index-types';
import getDisplacementMap from '../../../get-displacement-map';
import { addClosest, removeClosest } from '../update-displacement';
import getDisplacedBy from '../../../get-displaced-by';
import fromReorder from './from-reorder';
import fromCombine from './from-combine';
import removeDraggableFromList from '../../../remove-draggable-from-list';

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
  onLift: OnLift,
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  draggables,
  destination,
  insideDestination,
  previousImpact,
  onLift,
}: Args): ?DragImpact => {
  const instruction: ?Instruction = (() => {
    // moving from reorder
    if (previousImpact.destination) {
      return fromReorder({
        isMovingForward,
        isInHomeList,
        draggable,
        location: previousImpact.destination,
        insideDestination,
      });
    }

    // moving from merge
    if (previousImpact.merge) {
      return fromCombine({
        isMovingForward,
        destination,
        previousImpact,
        draggables,
        merge: previousImpact.merge,
        onLift,
      });
    }

    invariant('Cannot move to next spot without a destination or merge');
    return null;
  })();

  if (instruction == null) {
    return null;
  }

  const { proposedIndex, modifyDisplacement } = instruction;
  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
  );

  const displaced: Displacement[] = (() => {
    const lastDisplaced: Displacement[] = previousImpact.movement.displaced;

    if (!modifyDisplacement) {
      return lastDisplaced;
    }

    if (isMovingForward) {
      return removeClosest(lastDisplaced);
    }

    // moving backwards - will increase the amount of displaced items

    const withoutDraggable: DraggableDimension[] = removeDraggableFromList(
      draggable,
      insideDestination,
    );

    const atProposedIndex: DraggableDimension = withoutDraggable[proposedIndex];
    return addClosest(atProposedIndex, lastDisplaced);
  })();

  console.group('result');
  console.log('displaced:', displaced.map(d => d.draggableId));
  console.log('new index', proposedIndex);
  console.groupEnd();

  return {
    movement: {
      displacedBy,
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
