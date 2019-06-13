// @flow
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Viewport,
  Combine,
  ImpactLocation,
  UserDirection,
} from '../../types';
import { warning } from '../../dev-warning';
import calculateReorderImpact from '../calculate-drag-impact/calculate-reorder-impact';
import calculateCombineImpact from '../calculate-drag-impact/calculate-combine-impact';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';

type RecomputeArgs = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  viewport: Viewport,
  forceShouldAnimate?: boolean,
  userDirection: UserDirection,
|};

export default ({
  impact,
  draggable,
  viewport,
  draggables,
  destination,
  userDirection,
  forceShouldAnimate,
}: RecomputeArgs): DragImpact => {
  const at: ?ImpactLocation = impact.at;
  if (!at) {
    warning('Not recomputing impact as there is no destination');
    return impact;
  }

  if (at.type === 'REORDER') {
    const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
      destination.descriptor.id,
      draggables,
    );
    return calculateReorderImpact({
      forceShouldAnimate,
      draggable,
      insideDestination,
      destination,
      viewport,
      displacedBy: impact.displacedBy,
      last: impact.displaced,
      index: at.destination.index,
    });
  }

  const combine: Combine = at.combine;

  return calculateCombineImpact({
    combineWithId: combine.draggableId,
    destinationId: combine.droppableId,
    userDirection,
    previousImpact: impact,
  });
};
