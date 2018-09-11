// @flow
import type {
  DroppableDimension,
  DragImpact,
  CombineImpact,
  DraggableDimension,
  DraggableDimensionMap,
} from '../../../../../types';
import inHomeList from './in-home-list';
import inForeignList from './in-foreign-list';
import type { MoveFromResult } from '../move-to-next-index-types';

type Args = {|
  isInHomeList: boolean,
  isMovingForward: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  draggables: DraggableDimensionMap,
|};

export default ({
  isInHomeList,
  isMovingForward,
  draggable,
  destination,
  previousImpact,
  draggables,
}: Args): ?MoveFromResult => {
  if (!destination.isCombineEnabled) {
    return null;
  }
  const merge: ?CombineImpact = previousImpact.merge;

  // only handling cases which had a merge
  if (!merge) {
    return null;
  }

  return inHomeList({
    isInHomeList,
    isMovingForward,
    draggable,
    destination,
    merge,
    movement: previousImpact.movement,
    draggables,
  });

  // return isInHomeList
  //   ? inHomeList({
  //       isMovingForward,
  //       draggable,
  //       destination,
  //       merge,
  //       movement: previousImpact.movement,
  //       draggables,
  //     })
  //   : inForeignList({
  //       isMovingForward,
  //       draggable,
  //       destination,
  //       merge,
  //       movement: previousImpact.movement,
  //       draggables,
  //     });
};
