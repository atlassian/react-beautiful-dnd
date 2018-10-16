// @flow
import type {
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Displacement,
  Viewport,
} from '../../types';
import getDisplacement from '../get-displacement';
import withNewDisplacement from './with-new-displacement';

type RecomputeArgs = {|
  impact: DragImpact,
  destination: DroppableDimension,
  viewport: Viewport,
  draggables: DraggableDimensionMap,
|};

export default ({
  impact,
  viewport,
  destination,
  draggables,
}: RecomputeArgs): DragImpact => {
  const updated: Displacement[] = impact.movement.displaced.map(
    (entry: Displacement) =>
      getDisplacement({
        draggable: draggables[entry.draggableId],
        destination,
        previousImpact: impact,
        viewport: viewport.frame,
      }),
  );

  return withNewDisplacement(impact, updated);
};
