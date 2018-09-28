// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type {
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DropReason,
  CombineImpact,
} from '../../../../../types';
import whenReordering from './when-reordering';
import whenCombining from './when-combining';

type Args = {|
  reason: DropReason,
  impact: DragImpact,
  draggable: DraggableDimension,
  droppable: ?DroppableDimension,
  draggables: DraggableDimensionMap,
|};

export default ({
  reason,
  impact,
  draggable,
  droppable,
  draggables,
}: Args): Position => {
  const original: Position = draggable.client.borderBox.center;

  // return to home location
  if (reason === 'CANCEL') {
    return original;
  }

  // not dropping anywhere
  if (!droppable) {
    return original;
  }

  if (impact.destination) {
    return whenReordering({
      movement: impact.movement,
      draggable,
      draggables,
      droppable,
    });
  }

  const merge: ?CombineImpact = impact.merge;
  invariant(merge, 'Expected there to be a merge or reorder impact');

  return whenCombining({
    movement: impact.movement,
    combine: merge.combine,
    draggables,
  });
};
