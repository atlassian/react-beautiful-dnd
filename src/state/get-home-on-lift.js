// @flow
import invariant from 'tiny-invariant';
import getHomeLocation from './get-home-location';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  DisplacedBy,
  Viewport,
  DraggableIdMap,
  DisplacementGroups,
  DraggableId,
  OnLift,
} from '../types';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import getDisplacedBy from './get-displaced-by';
import getDisplacementGroups from './get-displacement-groups';

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

  const afterDragging: DraggableDimension[] = insideHome.slice(rawIndex + 1);
  // TODO: toDroppableIdMap?
  const wasDisplaced: DraggableIdMap = afterDragging.reduce(
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

  const displaced: DisplacementGroups = getDisplacementGroups({
    afterDragging,
    destination: home,
    displacedBy,
    last: null,
    viewport: viewport.frame,
    // originally we do not want any animation as we want
    // everything to be fixed in the same position that
    // it started in
    forceShouldAnimate: false,
  });

  const closestAfter: ?DraggableId = afterDragging.length
    ? afterDragging[0].descriptor.id
    : null;

  const impact: DragImpact = {
    displaced,
    displacedBy,
    at: {
      type: 'REORDER',
      closestAfter,
      destination: getHomeLocation(draggable.descriptor),
    },
  };

  return { impact, onLift };
};
