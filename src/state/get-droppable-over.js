// @flow
import { type Position, type Rect } from 'css-box-model';
import type {
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
  DraggableDimension,
  Axis,
} from '../types';
import { toDroppableList } from './dimension-structures';
import isPositionInFrame from './visibility/is-position-in-frame';
import { distance } from './position';
import { invariant } from '../invariant';
import isWithin from './is-within';
import { find } from '../native-with-fallback';

// https://stackoverflow.com/questions/306316/determine-if-two-rectangles-overlap-each-other
// https://silentmatt.com/rectangle-intersection/
function getHasOverlap(first: Rect, second: Rect): boolean {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

type Args = {|
  pageBorderBox: Rect,
  draggable: DraggableDimension,
  droppables: DroppableDimensionMap,
|};

function getActive(droppable: DroppableDimension): Rect {
  const active: ?Rect = droppable.subject.active;
  invariant(active, 'Expected droppable to be visible');
  return active;
}

type WithDistance = {|
  distance: number,
  id: DroppableId,
|};
function getFurthestAway(
  home: DroppableDimension,
  droppables: DroppableDimension[],
): ?DroppableId {
  const center: Position = home.page.borderBox.center;

  const sorted: WithDistance[] = droppables
    .map((item: DroppableDimension): WithDistance => {
      return {
        id: item.descriptor.id,
        distance: distance(center, item.page.borderBox.center),
      };
    })
    // largest value will be first
    .sort((a: WithDistance, b: WithDistance) => b.distance - a.distance);

  // just being safe
  return sorted[0] ? sorted[0].id : null;
}

export default function getDroppableOver({
  pageBorderBox,
  draggable,
  droppables,
}: Args): ?DroppableId {
  const potentials: DroppableDimension[] = toDroppableList(droppables).filter(
    (droppable: DroppableDimension): boolean => {
      if (!droppable.isEnabled) {
        return false;
      }
      const active: ?Rect = droppable.subject.active;
      if (!active) {
        return false;
      }
      return getHasOverlap(pageBorderBox, active);
    },
  );

  if (!potentials.length) {
    return null;
  }

  // We know at this point that some overlap has to exist
  const candidates: DroppableDimension[] = potentials.filter(
    (item: DroppableDimension): boolean => {
      const axis: Axis = item.axis;
      const active: Rect = getActive(item);
      const childCenter: number = active.center[axis.crossAxisLine];
      const crossAxisStart: number = pageBorderBox[axis.crossAxisStart];
      const crossAxisEnd: number = pageBorderBox[axis.crossAxisEnd];

      const isContained = isWithin(
        active[axis.crossAxisStart],
        active[axis.crossAxisEnd],
      );

      const isStartContained: boolean = isContained(crossAxisStart);
      const isEndContained: boolean = isContained(crossAxisEnd);

      // Dragging item is totally covering the active area
      if (!isStartContained && !isEndContained) {
        return true;
      }

      // Both within edges: going to cover this in a later check (center check)
      if (isStartContained && isEndContained) {
        return false;
      }

      if (isStartContained) {
        return crossAxisStart < childCenter;
      }

      return crossAxisEnd > childCenter;
    },
  );

  // Yay
  if (candidates.length === 1) {
    return candidates[0].descriptor.id;
  }

  const home: DroppableDimension = droppables[draggable.descriptor.droppableId];

  // Multiple options returned
  // Should only occur with really large items
  // Going to use *crap* fallback: distance from start
  if (candidates.length > 1) {
    return getFurthestAway(home, candidates);
  }

  const centerOver: ?DroppableDimension = find(
    potentials,
    (item: DroppableDimension): boolean => {
      return isPositionInFrame(getActive(item))(pageBorderBox.center);
    },
  );

  return centerOver ? centerOver.descriptor.id : null;
}
