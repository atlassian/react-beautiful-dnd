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
  DraggableIdMap,
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

  const originallyDisplaced: DraggableDimension[] = insideHome.slice(
    draggable.descriptor.index + 1,
  );
  const wasDisplacedOnLift: DraggableIdMap = originallyDisplaced.reduce(
    (previous: DraggableIdMap, item: DraggableDimension): DraggableIdMap => {
      previous[item.descriptor.id] = true;
      return previous;
    },
    {},
  );

  const displaced: Displacement[] = originallyDisplaced.map(
    (dimension: DraggableDimension): Displacement =>
      getDisplacement({
        draggable: dimension,
        destination: home,
        previousImpact: noImpact,
        viewport: viewport.frame,
        // originally we do not want any animation as we want
        // everything to be fixed in the same position that
        // it started in
        forceShouldAnimate: false,
        wasDisplacedOnLift,
        displacedByOnLift: displacedBy,
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
