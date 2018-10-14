// @flow
import type { Position } from 'css-box-model';
import whenCombining from './when-combining';
import whenReordering from './when-reordering';
import withDroppableDisplacement from '../../with-scroll-change/with-droppable-displacement';
import type {
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  CombineImpact,
  DraggableLocation,
} from '../../../types';

type Args = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  droppable: ?DroppableDimension,
  draggables: DraggableDimensionMap,
|};

const withoutDroppableDisplacement = ({
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

export default (args: Args): Position => {
  const withoutDisplacement: Position = withoutDroppableDisplacement(args);

  const droppable: ?DroppableDimension = args.droppable;

  const withDisplacement: Position = droppable
    ? withDroppableDisplacement(droppable, withoutDisplacement)
    : withoutDisplacement;

  return withDisplacement;
};
