// @flow
import type { Position } from 'css-box-model';
import type {
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  ImpactLocation,
  LiftEffect,
} from '../../../types';
import whenCombining from './when-combining';
import whenReordering from './when-reordering';
import withDroppableDisplacement from '../../with-scroll-change/with-droppable-displacement';

type Args = {|
  impact: DragImpact,
  afterCritical: LiftEffect,
  draggable: DraggableDimension,
  droppable: ?DroppableDimension,
  draggables: DraggableDimensionMap,
|};

const getResultWithoutDroppableDisplacement = ({
  impact,
  draggable,
  droppable,
  draggables,
  afterCritical,
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
      impact,
      draggable,
      draggables,
      droppable,
      afterCritical,
    });
  }

  return whenCombining({
    impact,
    draggables,
    afterCritical,
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
