// @flow
import type { Position, Rect, BoxModel } from 'css-box-model';
import { toDroppableList } from './dimension-structures';
import { distance } from './position';
import isWithin from './is-within';

import type {
  DroppableId,
  DroppableDimension,
  DraggableDimension,
  DroppableDimensionMap,
} from '../types';

type isCandidateArgs = {|
  active: Rect,
  target: Position,
  client: BoxModel,
|};

const isCandidate = ({ active, target, client }: isCandidateArgs) => {
  const isWithinVertical = isWithin(active.top, active.bottom)(target.y);
  const isWithinHorizontal = isWithin(active.left, active.right)(target.x);
  const { width: draggableWidth } = client.borderBox;
  const activeCenterHorizontal = active.center.x;
  const isCollidingLeft =
    activeCenterHorizontal > target.x - draggableWidth / 2;
  const isCollidingRight =
    activeCenterHorizontal < target.x + draggableWidth / 2;

  // TODO: shrink active

  // TODO: current draggable rect have any overlap with smaller active

  // Has one of the edges passed a center point

  // TODO: check vertical cases
  if (isCollidingLeft && target.x > activeCenterHorizontal) {
    return true;
  }

  if (isCollidingRight && target.x <= activeCenterHorizontal) {
    return true;
  }

  // Is it within the frame
  return isWithinVertical && isWithinHorizontal;
};

type Args = {|
  target: Position,
  draggable: DraggableDimension,
  droppables: DroppableDimensionMap,
|};

export default ({ target, draggable, droppables }: Args): ?DroppableId => {
  const active = toDroppableList(droppables).filter(
    (droppable: DroppableDimension) => {
      // only want enabled droppables
      if (!droppable.isEnabled) {
        return false;
      }

      const active: ?Rect = droppable.subject.active;

      if (!active) {
        return false;
      }

      return isCandidate({ active, target, client: draggable.client });
    },
  );

  const origin = droppables[draggable.descriptor.droppableId];

  const preferences = active.sort(
    (prev, next) =>
      distance(origin.client.borderBox.center, next.client.borderBox.center) -
      distance(origin.client.borderBox.center, prev.client.borderBox.center),
  );

  return preferences.length ? preferences[0].descriptor.id : undefined;
};
