// @flow
import { type Position } from 'css-box-model';
import type {
  DraggableDimensionMap,
  DragImpact,
  CombineImpact,
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
  const merge: ?CombineImpact = impact.merge;

  if (!merge) {
    return null;
  }
  const groupingWith: DraggableId = merge.combine.draggableId;
  const isDisplaced: boolean = Boolean(impact.movement.map[groupingWith]);
  const center: Position = draggables[groupingWith].client.borderBox.center;

  return isDisplaced ? add(center, impact.movement.displacedBy.point) : center;
};
