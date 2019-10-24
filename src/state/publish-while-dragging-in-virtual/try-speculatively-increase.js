// @flow
import type {
  DraggableDimensionMap,
  DroppableDimension,
  DragImpact,
  DraggableDimension,
  DisplacedBy,
  Viewport,
} from '../../types';
import getDisplacedBy from '../get-displaced-by';
import speculativelyIncrease from '../update-displacement-visibility/speculatively-increase';

type Args = {|
  impact: DragImpact,
  viewport: Viewport,
  destination: ?DroppableDimension,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
|};

export default function trySpeculativelyIncrease({
  impact,
  destination,
  viewport,
  draggable,
  draggables,
}: Args): DragImpact {
  if (!destination) {
    return impact;
  }

  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
  );

  return speculativelyIncrease({
    impact,
    destination,
    viewport,
    draggables,
    maxScrollChange: displacedBy.point,
  });
}
