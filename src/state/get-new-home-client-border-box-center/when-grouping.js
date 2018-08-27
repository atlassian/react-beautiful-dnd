// @flow
import { type Position } from 'css-box-model';
import type {
  DraggableDimensionMap,
  DragImpact,
  GroupingImpact,
  DraggableId,
} from '../../types';
import { add } from '../position';

type Args = {|
  impact: DragImpact,
  // all draggables in the system
  draggables: DraggableDimensionMap,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({ impact, draggables }: Args): ?Position => {
  // If grouping return the center position of the group target
  const group: ?GroupingImpact = impact.group;

  if (!group) {
    return null;
  }
  const groupingWith: DraggableId = group.groupingWith.draggableId;
  const isDisplaced: boolean = Boolean(impact.movement.map[groupingWith]);
  const center: Position = draggables[groupingWith].client.borderBox.center;

  return isDisplaced ? add(center, impact.movement.displacedBy.point) : center;
};
