// @flow
import type { Position } from 'css-box-model';
import type {
  DragImpact,
  DroppableDimension,
  Displacement,
  GroupingImpact,
} from '../../types';
import getDisplacementMap from '../get-displacement-map';

type Args = {|
  pageBorderBoxCenter: Position,
  impact: DragImpact,
  destination: DroppableDimension,
|};

export default ({
  pageBorderBoxCenter,
  impact,
  destination,
}: Args): DragImpact => {
  if (!destination.isGroupingEnabled) {
    return impact;
  }

  // Nothing would have been displaced
  if (!impact.movement.displaced.length) {
    return impact;
  }

  // the displaced array is ordered by closest impacted
  // the only possible grouping target is the closest displaced
  const target: Displacement = impact.movement.displaced[0];

  const group: GroupingImpact = {
    groupingWith: {
      draggableId: target.draggableId,
      droppableId: destination.descriptor.id,
    },
  };
  console.group('yay');

  console.log(
    'before roup displacement',
    impact.movement.displaced.map(i => i.draggableId),
  );

  const withoutGroupedWith: Displacement[] = impact.movement.displaced.slice(1);

  const withGroup: DragImpact = {
    ...impact,
    movement: {
      ...impact.movement,
      displaced: withoutGroupedWith,
      map: getDisplacementMap(withoutGroupedWith),
    },
    group,
  };

  console.log(
    'with group displaced',
    withGroup.movement.displaced.map(i => i.draggableId),
  );
  console.groupEnd();

  return withGroup;
};
