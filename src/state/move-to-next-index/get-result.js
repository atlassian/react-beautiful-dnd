// @flow
import { subtract } from '../position';
import isTotallyVisibleInNewLocation from './is-totally-visible-in-new-location';
import getViewport from '../visibility/get-viewport';
import type { Result } from './move-to-next-index-types';
import type { IsVisibleResult } from '../visibility/is-visible';
import type {
  DroppableDimension,
  DraggableDimension,
  Position,
  DragImpact,
  ScrollJumpRequest,
} from '../../types';

type Args = {|
  destination: DroppableDimension,
  draggable: DraggableDimension,
  previousPageCenter: Position,
  newPageCenter: Position,
  newImpact: DragImpact,
|}

export default ({
  destination,
  draggable,
  previousPageCenter,
  newPageCenter,
  newImpact,
}: Args): Result => {
  const isTotallyVisible: IsVisibleResult = isTotallyVisibleInNewLocation({
    draggable,
    destination,
    newPageCenter,
    viewport: getViewport(),
  });

  if (isTotallyVisible.isVisible) {
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
    target: isTotallyVisible.isVisibleInDroppable ? 'WINDOW' : 'DROPPABLE',
  };

  return {
    // Using the previous page center with a new impact
    // as we are not visually moving the Draggable
    pageCenter: previousPageCenter,
    impact: newImpact,
    scrollJumpRequest: request,
  };
};
