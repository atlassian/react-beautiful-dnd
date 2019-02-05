// @flow
import type { Position } from 'css-box-model';
import type {
  DisplacementMap,
  OnLift,
  DraggableId,
  DisplacedBy,
} from '../types';
import { origin, negate } from './position';
import didStartDisplaced from './starting-displaced/did-start-displaced';

type Args = {|
  displaced: DisplacementMap,
  onLift: OnLift,
  combineWith: DraggableId,
  displacedBy: DisplacedBy,
|};

export default ({
  displaced,
  onLift,
  combineWith,
  displacedBy,
}: Args): Position => {
  const isDisplaced: boolean = Boolean(displaced[combineWith]);

  if (didStartDisplaced(combineWith, onLift)) {
    return isDisplaced ? origin : negate(displacedBy.point);
  }

  return isDisplaced ? displacedBy.point : origin;
};
