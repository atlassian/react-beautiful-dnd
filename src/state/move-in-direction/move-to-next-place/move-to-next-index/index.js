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
import fromReorder from './from-reorder';
import getPageBorderBoxCenterFromImpact from '../../../get-page-border-box-center-from-impact';
import fromCombine from './from-combine';

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
  const impact: ?DragImpact = (() => {
    if (previousImpact.destination) {
      return fromReorder({
        isMovingForward,
        isInHomeList,
        draggable,
        destination,
        previousImpact,
        insideDestination,
      });
    }

    invariant(
      previousImpact.merge,
      'Cannot move to next spot without a destination or merge',
    );
    // return fromCombine({});
  })();

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
