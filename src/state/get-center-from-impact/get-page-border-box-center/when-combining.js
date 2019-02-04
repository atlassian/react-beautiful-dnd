// @flow
import { type Position } from 'css-box-model';
import type {
  DraggableDimensionMap,
  DraggableId,
  Combine,
  DragMovement,
  OnLift,
} from '../../../types';
import { add } from '../../position';

type Args = {|
  movement: DragMovement,
  combine: Combine,
  // all draggables in the system
  draggables: DraggableDimensionMap,
  onLift: OnLift,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({ combine, onLift, movement, draggables }: Args): Position => {
  const groupingWith: DraggableId = combine.draggableId;
  const center: Position = draggables[groupingWith].page.borderBox.center;

  // should we take displacement into account?
  // TODO: consolidate with get-combine-impact.js
  const didStartDisplaced: boolean = Boolean(onLift.wasDisplaced[groupingWith]);
  const isDisplaced: boolean = Boolean(movement.map[groupingWith]);
  const shouldAddDisplacement: boolean = !didStartDisplaced && isDisplaced;

  return shouldAddDisplacement
    ? add(center, movement.displacedBy.point)
    : center;
};
