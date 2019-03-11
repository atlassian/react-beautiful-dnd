// @flow
import type {
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Displacement,
  Viewport,
  OnLift,
} from '../../types';
import getDisplacement from '../get-displacement';
import withNewDisplacement from './with-new-displacement';

type RecomputeArgs = {|
  impact: DragImpact,
  destination: DroppableDimension,
  viewport: Viewport,
  onLift: OnLift,
  draggables: DraggableDimensionMap,
  forceShouldAnimate?: boolean,
|};

export default ({
  impact,
  viewport,
  destination,
  draggables,
  onLift,
  forceShouldAnimate,
}: RecomputeArgs): DragImpact => {
  const updated: Displacement[] = impact.movement.displaced.map(
    (entry: Displacement) =>
      getDisplacement({
        draggable: draggables[entry.draggableId],
        destination,
        previousImpact: impact,
        viewport: viewport.frame,
        onLift,
        forceShouldAnimate,
      }),
  );

  return withNewDisplacement(impact, updated);
};
