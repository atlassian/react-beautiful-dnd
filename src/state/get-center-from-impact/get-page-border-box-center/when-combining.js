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
import getCombinedItemDisplacement from '../../get-combined-item-displacement';

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
  const combineWith: DraggableId = combine.draggableId;
  const center: Position = draggables[combineWith].page.borderBox.center;

  const displaceBy: Position = getCombinedItemDisplacement({
    displaced: movement.map,
    onLift,
    combineWith,
    displacedBy: movement.displacedBy,
  });

  return add(center, displaceBy);
};
