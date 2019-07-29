// @flow
import invariant from 'tiny-invariant';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  LiftEffect,
  Viewport,
  ImpactLocation,
} from '../../../../types';
import calculateReorderImpact from '../../../calculate-drag-impact/calculate-reorder-impact';
import fromCombine from './from-combine';
import fromReorder from './from-reorder';

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
    displaced: previousImpact.displaced,
    draggables,
    combine: wasAt.combine,
    afterCritical,
  });
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
};
