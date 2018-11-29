// @flow
import type { Position, Rect } from 'css-box-model';
import { getRect } from 'css-box-model';
import { toDroppableList } from './dimension-structures';
import isPositionInFrame from './visibility/is-position-in-frame';
import { find } from '../native-with-fallback';
import getDisplacedBy from './get-displaced-by';
import type {
  DisplacedBy,
  DraggableDimension,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
} from '../types';

type Args = {|
  target: Position,
  droppables: DroppableDimensionMap,
  draggable: DraggableDimension,
|};

const getNewActiveRect = (active: Rect, displacedBy: DisplacedBy) => {
  const height = active.height + displacedBy.point.y;
  const width = active.width + displacedBy.point.x;
  const top = active.top;
  const left = active.left;
  const bottom = top + height;
  const right = left + width;

  const rect = getRect({
    top,
    right,
    bottom,
    left,
  });

  return rect;
};

export default ({ target, droppables, draggable }: Args): ?DroppableId => {
  const maybe: ?DroppableDimension = find(
    toDroppableList(droppables),
    (droppable: DroppableDimension): boolean => {
      // only want enabled droppables
      if (!droppable.isEnabled) {
        return false;
      }

      const active: ?Rect = droppable.subject.active;

      if (!active) {
        return false;
      }

      // in home list, no need for extra active area
      const droppableId = droppable.descriptor.id;
      const sourceDroppableId = draggable.descriptor.droppableId;
      if (droppableId === sourceDroppableId) {
        return isPositionInFrame(active)(target);
      }

      // in foreign list, add extra draggable displacement to active area
      const displacedBy: DisplacedBy = getDisplacedBy(
        droppable.axis,
        draggable.displaceBy,
        true, // always displace forward in foreign list
      );
      const increasedActive: Rect = getNewActiveRect(active, displacedBy);

      // Not checking to see if visible in viewport
      // as the target might be off screen if dragging a large draggable
      // Not adjusting target for droppable scroll as we are just checking
      // if it is over the droppable - not its internal impact
      return isPositionInFrame(increasedActive)(target);
    },
  );

  return maybe ? maybe.descriptor.id : null;
};
