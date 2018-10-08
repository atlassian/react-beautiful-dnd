// @flow
import { type Position } from 'css-box-model';
import type {
  DraggableDimensionMap,
  DraggableId,
  Combine,
  DragMovement,
} from '../../types';
import { add } from '../position';

type Args = {|
  movement: DragMovement,
  combine: Combine,
  // all draggables in the system
  draggables: DraggableDimensionMap,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({ combine, movement, draggables }: Args): Position => {
  const groupingWith: DraggableId = combine.draggableId;
  const isDisplaced: boolean = Boolean(movement.map[groupingWith]);
  const center: Position = draggables[groupingWith].page.borderBox.center;

  return isDisplaced ? add(center, movement.displacedBy.point) : center;
};
