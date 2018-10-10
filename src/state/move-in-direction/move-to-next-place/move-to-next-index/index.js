// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type { MoveResult } from '../move-to-next-place-types';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
} from '../../../../types';
import fromReorder from './get-next-impact/get-next-index-from-reorder';
import getPageBorderBoxCenterFromImpact from '../../../get-center-from-impact/get-page-border-box-center';
import fromCombine from './get-next-impact/get-next-index-from-combine';
import getNextImpact from './get-next-impact';

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  destination,
  draggables,
  insideDestination,
  previousImpact,
}: Args): ?MoveResult => {
  const impact: ?DragImpact = getNextImpact({
    isMovingForward,
    isInHomeList,
    draggable,
    draggables,
    destination,
    insideDestination,
    previousImpact,
  });

  // no impact can be achieved
  if (!impact) {
    return null;
  }

  const pageBorderBoxCenter: Position = getPageBorderBoxCenterFromImpact({
    impact,
    draggable,
    droppable: destination,
    draggables,
  });

  return {
    pageBorderBoxCenter,
    impact,
  };
};
