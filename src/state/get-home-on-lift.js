// @flow
import invariant from 'tiny-invariant';
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
  OnLift,
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

type Result = {|
  onLift: OnLift,
  impact: DragImpact,
|};

export default ({ draggable, home, draggables, viewport }: Args): Result => {
  const displacedBy: DisplacedBy = getDisplacedBy(
    home.axis,
    draggable.displaceBy,
  );

  const insideHome: DraggableDimension[] = getDraggablesInsideDroppable(
    home.descriptor.id,
    draggables,
  );

  // in a list that does not start at 0 the descriptor.index might be different from the index in the list
  // eg a list could be: [2,3,4]. A descriptor.index of '2' would actually be in index '0' of the list
  const rawIndex: number = insideHome.indexOf(draggable);
  invariant(rawIndex !== -1, 'Expected draggable to be inside home list');

  const originallyDisplaced: DraggableDimension[] = insideHome.slice(
    rawIndex + 1,
  );
  const wasDisplaced: DraggableIdMap = originallyDisplaced.reduce(
    (previous: DraggableIdMap, item: DraggableDimension): DraggableIdMap => {
      previous[item.descriptor.id] = true;
      return previous;
    },
    {},
  );
  const onLift: OnLift = {
    displacedBy,
    wasDisplaced,
  };

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
        onLift,
      }),
  );

  const movement: DragMovement = {
    displaced,
    map: getDisplacementMap(displaced),
    displacedBy,
  };

  const impact: DragImpact = {
    movement,
    destination: getHomeLocation(draggable.descriptor),
    merge: null,
  };

  return { impact, onLift };
};
