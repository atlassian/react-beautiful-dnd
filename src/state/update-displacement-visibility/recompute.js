// @flow
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Viewport,
  DraggableId,
  DisplacementGroups,
} from '../../types';
import getDisplacementGroups from '../get-displacement-groups';

type RecomputeArgs = {|
  impact: DragImpact,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  viewport: Viewport,
  forceShouldAnimate?: boolean,
|};

function getDraggables(
  ids: DraggableId[],
  draggables: DraggableDimensionMap,
): DraggableDimension[] {
  return ids.map((id: DraggableId): DraggableDimension => draggables[id]);
}

export default ({
  impact,
  viewport,
  draggables,
  destination,
  forceShouldAnimate,
}: RecomputeArgs): DragImpact => {
  const last: DisplacementGroups = impact.displaced;
  const afterDragging: DraggableDimension[] = getDraggables(
    last.all,
    draggables,
  );

  const displaced: DisplacementGroups = getDisplacementGroups({
    afterDragging,
    destination,
    displacedBy: impact.displacedBy,
    viewport: viewport.frame,
    forceShouldAnimate,
    last,
  });

  return {
    ...impact,
    displaced,
  };
};
