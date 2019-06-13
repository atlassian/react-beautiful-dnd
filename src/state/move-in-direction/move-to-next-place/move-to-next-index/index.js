// @flow
import invariant from 'tiny-invariant';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  DisplacedBy,
  Displacement,
  LiftEffect,
  Viewport,
  ImpactLocation,
} from '../../../../types';
import type { Instruction } from './move-to-next-index-types';
import getDisplacementMap from '../../../get-displacement-map';
import { addClosest, removeClosest } from '../update-displacement';
import getDisplacedBy from '../../../get-displaced-by';
import fromReorder from './from-reorder';
import fromCombine from './from-combine';
import removeDraggableFromList from '../../../remove-draggable-from-list';
import getDisplaced from '../../../get-displaced';
import calculateReorderImpact from '../../../calculate-drag-impact/calculate-reorder-impact';

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
  viewport: Viewport,
  afterCritical: LiftEffect,
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  draggables,
  destination,
  insideDestination,
  previousImpact,
  viewport,
  afterCritical,
}: Args): ?DragImpact => {
  const wasAt: ?ImpactLocation = previousImpact.at;
  invariant(wasAt, 'Cannot move in direction without previous impact location');

  if (wasAt.type === 'REORDER') {
    const newIndex: ?number = fromReorder({
      isMovingForward,
      isInHomeList,
      location: wasAt.destination,
      insideDestination,
    });
    // TODO: can we just pass new index on?
    if (newIndex == null) {
      return null;
    }
    return calculateReorderImpact({
      draggable,
      insideDestination,
      destination,
      viewport,
      last: previousImpact.displaced,
      displacedBy: previousImpact.displacedBy,
      index: newIndex,
    });
  }

  // COMBINE
  const newIndex: ?number = fromCombine({
    isMovingForward,
    destination,
    previousImpact,
    draggables,
    combine: wasAt.combine,
    afterCritical,
  });
  if (newIndex == null) {
    return null;
  }

  return calculateCombineImpact({
    draggable,
    insideDestination,
    destination,
    viewport,
    last: previousImpact.displaced,
    displacedBy: previousImpact.displacedBy,
    index: newIndex,
  });

  const instruction: ?Instruction = (() => {
    // moving from reorder
    if (previousImpact.destination) {
      return fromReorder({
        isMovingForward,
        isInHomeList,
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

    const startIndex: number = insideDestination[0].descriptor.index;
    const atProposedIndex: ?DraggableDimension =
      withoutDraggable[proposedIndex - startIndex];
    invariant(
      atProposedIndex,
      `Could not find item at proposed index ${proposedIndex}`,
    );
    return addClosest(atProposedIndex, lastDisplaced);
  })();

  return {
    movement: {
      displacedBy,
      displaced,
      map: getDisplacementMap(displaced),
    },
    destination: {
      droppableId: destination.descriptor.id,
      index: proposedIndex,
    },
    merge: null,
  };
};
