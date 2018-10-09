// @flow
import type {
  Viewport,
  DragImpact,
  DraggableDimensionMap,
  DroppableDimension,
  Displacement,
} from '../types';
import getDisplacement from './get-displacement';
import getDisplacementMap from './get-displacement-map';

type Args = {|
  previousImpact: DragImpact,
  viewport: Viewport,
  destination: DroppableDimension,
  draggables: DraggableDimensionMap,
|};

export default ({
  previousImpact,
  viewport,
  destination,
  draggables,
}: Args): DragImpact => {
  const displaced: Displacement[] = previousImpact.movement.displaced.map(
    (current: Displacement): Displacement =>
      getDisplacement({
        draggable: draggables[current.draggableId],
        destination,
        previousImpact,
        viewport: viewport.frame,
      }),
  );

  const updated: DragImpact = {
    ...previousImpact,
    movement: {
      ...previousImpact.movement,
      displaced,
      map: getDisplacementMap(displaced),
    },
  };
  return updated;
};
