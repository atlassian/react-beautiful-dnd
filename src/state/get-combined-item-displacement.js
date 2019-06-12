// @flow
import type { Position } from 'css-box-model';
import type {
  DisplacementGroups,
  LiftEffect,
  DraggableId,
  DisplacedBy,
} from '../types';
import { origin, negate } from './position';
import didStartDisplaced from './starting-displaced/did-start-displaced';

type Args = {|
  displaced: DisplacementGroups,
  displacedByLift: LiftEffect,
  combineWith: DraggableId,
  displacedBy: DisplacedBy,
|};

export default ({
  displaced,
  displacedByLift,
  combineWith,
  displacedBy,
}: Args): Position => {
  const isDisplaced: boolean = Boolean(
    displaced.visible[combineWith] || displaced.invisible[combineWith],
  );

  if (didStartDisplaced(combineWith, displacedByLift)) {
    return isDisplaced ? origin : negate(displacedBy.point);
  }

  return isDisplaced ? displacedBy.point : origin;
};
