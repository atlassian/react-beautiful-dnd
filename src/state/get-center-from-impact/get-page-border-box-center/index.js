// @flow
import type { Position } from 'css-box-model';
import type {
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  ImpactLocation,
  OnLift,
} from '../../../types';
import whenCombining from './when-combining';
import whenReordering from './when-reordering';
import withDroppableDisplacement from '../../with-scroll-change/with-droppable-displacement';

type Args = {|
  impact: DragImpact,
  onLift: OnLift,
  draggable: DraggableDimension,
  droppable: ?DroppableDimension,
  draggables: DraggableDimensionMap,
|};

const getResultWithoutDroppableDisplacement = ({
  impact,
  draggable,
  droppable,
  draggables,
  onLift,
}: Args): Position => {
  const original: Position = draggable.page.borderBox.center;
  const at: ?ImpactLocation = impact.at;

  if (!droppable) {
    return original;
  }

  if (!at) {
    return original;
  }

  if (at.type === 'REORDER') {
    return whenReordering({
      movement: impact.movement,
      draggable,
      draggables,
      droppable,
      onLift,
    });
  }

  return whenCombining({
    movement: impact.movement,
    combine: merge.combine,
    draggables,
    onLift,
  });
};

export default (args: Args): Position => {
  const withoutDisplacement: Position = getResultWithoutDroppableDisplacement(
    args,
  );

  const droppable: ?DroppableDimension = args.droppable;

  const withDisplacement: Position = droppable
    ? withDroppableDisplacement(droppable, withoutDisplacement)
    : withoutDisplacement;

  return withDisplacement;
};
