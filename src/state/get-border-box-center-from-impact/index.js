// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import whenCombining from './when-combining';
import whenReordering from './when-reordering';
import type {
  DragImpact,
  DraggableDimension,
  DraggableDimensionMap,
  CombineImpact,
  DraggableLocation,
} from '../../types';

type Args = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  droppables: DroppableDimensionMap,
  draggables: DraggableDimensionMap,
|};

export default ({
  impact,
  draggable,
  droppable,
  draggables,
}: Args): Position => {
  const merge: ?CombineImpact = impact.merge;
  const destination: ?DraggableLocation = impact.destination;

  const original: Position = draggable.page.borderBox.center;

  if (!droppable) {
    return original;
  }

  if (destination) {
    return whenReordering({
      movement: impact.movement,
      draggable,
      draggables,
      droppable,
    });
  }

  if (merge) {
    return whenCombining({
      movement: impact.movement,
      combine: merge.combine,
      draggables,
    });
  }

  return original;
};
