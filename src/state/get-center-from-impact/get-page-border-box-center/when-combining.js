// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import type {
  DraggableDimensionMap,
  DraggableId,
  Combine,
  LiftEffect,
  DragImpact,
} from '../../../types';
import { add } from '../../position';
import getCombinedItemDisplacement from '../../get-combined-item-displacement';
import { tryGetCombine } from '../../get-impact-location';

type Args = {|
  impact: DragImpact,
  // all draggables in the system
  draggables: DraggableDimensionMap,
  displacedByLift: LiftEffect,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({ displacedByLift, impact, draggables }: Args): Position => {
  const combine: ?Combine = tryGetCombine(impact);
  invariant(combine);

  const combineWith: DraggableId = combine.draggableId;
  const center: Position = draggables[combineWith].page.borderBox.center;

  const displaceBy: Position = getCombinedItemDisplacement({
    displaced: impact.displaced,
    displacedByLift,
    combineWith,
    displacedBy: impact.displacedBy,
  });

  return add(center, displaceBy);
};
