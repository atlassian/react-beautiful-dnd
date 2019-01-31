// @flow
import getHomeLocation from './get-home-location';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Displacement,
  DisplacedBy,
  Viewport,
  DragMovement,
} from '../types';
import noImpact from './no-impact';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import getDisplacedBy from './get-displaced-by';
import getDisplacementMap from './get-displacement-map';
import getDisplacement from './get-displacement';

type Args = {|
  draggable: DraggableDimension,
  home: DroppableDimension,
  draggables: DraggableDimensionMap,
  viewport: Viewport,
|};

export default ({
  draggable,
  home,
  draggables,
  viewport,
}: Args): DragImpact => {
  const displacedBy: DisplacedBy = getDisplacedBy(
    home.axis,
    draggable.displaceBy,
  );

  const insideHome: DraggableDimension[] = getDraggablesInsideDroppable(
    home.descriptor.id,
    draggables,
  );

  const displaced: Displacement[] = insideHome
    .slice(draggable.descriptor.index)
    .map(
      (dimension: DraggableDimension): Displacement =>
        getDisplacement({
          draggable: dimension,
          destination: home,
          previousImpact: noImpact,
          viewport: viewport.frame,
          // disabling animation of secondary items on initial lift
          isAnimationEnabled: false,
        }),
    );

  const movement: DragMovement = {
    displaced,
    map: getDisplacementMap(displaced),
    displacedBy,
  };

  const impact: DragImpact = {
    movement,
    direction: home.axis.direction,
    destination: getHomeLocation(draggable.descriptor),
    merge: null,
  };

  return impact;
};
