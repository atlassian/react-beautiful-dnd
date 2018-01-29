// @flow
import { subtract } from '../position';
import type { Result } from './move-to-next-index-types';
import type { IsVisibleResult } from '../visibility/is-visible';
import type {
  DroppableDimension,
  Position,
  DragImpact,
  ScrollJumpRequest,
} from '../../types';

type Args = {|
  destination: DroppableDimension,
  previousPageCenter: Position,
  newPageCenter: Position,
  newImpact: DragImpact,
  isVisibleResult: IsVisibleResult,
|}

export default ({
  destination,
  previousPageCenter,
  newPageCenter,
  newImpact,
  isVisibleResult,
}: Args): Result => {
  if (isVisibleResult.isVisible) {
    const scrollDiff: Position = destination.viewport.frameScroll.diff.value;
    const withScrollDiff: Position = subtract(newPageCenter, scrollDiff);

    return {
      pageCenter: withScrollDiff,
      impact: newImpact,
      scrollJumpRequest: null,
    };
  }

  // The full distance required to get from the previous page center to the new page center
  const requiredDistance: Position = subtract(newPageCenter, previousPageCenter);

  // We need to consider how much the droppable scroll has changed
  const scrollDiff: Position = destination.viewport.frameScroll.diff.value;

  // The actual scroll required to move into the next place
  const requiredScroll: Position = subtract(requiredDistance, scrollDiff);

  const request: ScrollJumpRequest = {
    scroll: requiredScroll,
    target: isVisibleResult.isVisibleInDroppable ? 'WINDOW' : 'DROPPABLE',
  };

  return {
    // using the previous page center with a new impact
    // the subsequent droppable scroll
    pageCenter: newPageCenter,
    impact: newImpact,
    scrollJumpRequest: request,
  };
};
