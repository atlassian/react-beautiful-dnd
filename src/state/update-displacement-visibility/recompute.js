// @flow
import type {
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Displacement,
  Viewport,
  LiftEffect,
} from '../../types';
import getDisplacement from '../get-displacement';
import withNewDisplacement from './with-new-displacement';
import getDisplacementGroups from '../get-displacement-groups';

type RecomputeArgs = {|
  impact: DragImpact,
  destination: DroppableDimension,
  viewport: Viewport,
  afterCritical: LiftEffect,
  draggables: DraggableDimensionMap,
  forceShouldAnimate?: boolean,
|};

export default ({
  impact,
  viewport,
  destination,
  draggables,
  afterCritical,
  forceShouldAnimate,
}: RecomputeArgs): DragImpact => {
  // TODO!!!!
  console.warn('TODO: RECOMPUTE');
  return impact;
  const displaced: DisplacementGroups = getDisplacementGroups({
    afterDragging,
    destination,
    displacedBy,
    viewport,
    forceShouldAnimate,
    last: impact.displaced,
  });

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

  return {
    ...impact,
    displaced,
  };

  // return withNewDisplacement(impact, updated);
};
