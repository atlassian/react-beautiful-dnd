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
  forceShouldAnimate?: boolean,
|};

export default ({
  impact,
  viewport,
  destination,
  draggables,
  forceShouldAnimate,
}: RecomputeArgs): DragImpact => {
  const updated: Displacement[] = impact.movement.displaced.map(
    (entry: Displacement) =>
      getDisplacement({
        draggable: draggables[entry.draggableId],
        destination,
        previousImpact: impact,
        viewport: viewport.frame,
        forceShouldAnimate,
      }),
  );

  return withNewDisplacement(impact, updated);
};
