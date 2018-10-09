// @flow
import type { Position } from 'css-box-model';
import type { MoveResult } from '../move-to-next-place-types';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
} from '../../../../types';
import fromReorder from './from-reorder';
import getPageBorderBoxCenterFromImpact from '../../../get-page-border-box-center-from-impact';

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
  const impact: ?DragImpact = fromReorder({
    isMovingForward,
    isInHomeList,
    draggable,
    destination,
    previousImpact,
    insideDestination,
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
