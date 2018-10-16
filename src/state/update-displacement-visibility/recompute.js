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
  console.warn('recomputing displacement');
  const updated: Displacement[] = impact.movement.displaced.map(
    (entry: Displacement) =>
      getDisplacement({
        draggable: draggables[entry.draggableId],
        destination,
        previousImpact: impact,
        viewport: viewport.frame,
      }),
  );

  // TEMP Hack
  // const updated: Displacement[] = impact.movement.displaced.map(entry => ({
  //   draggableId: entry.draggableId,
  //   isVisible: true,
  //   shouldAnimate: true,
  // }));

  return withNewDisplacement(impact, updated);
};
