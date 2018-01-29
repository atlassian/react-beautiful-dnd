// @flow
import { subtract } from '../position';
import isTotallyVisibleInNewLocation from './is-totally-visible-in-new-location';
import getViewport from '../visibility/get-viewport';
import type { Result } from './move-to-next-index-types';
import type {
  DroppableDimension,
  DraggableDimension,
  Position,
  DragImpact,
} from '../../types';

type Args = {|
  destination: DroppableDimension,
  draggable: DraggableDimension,
  previousPageCenter: Position,
  newPageCenter: Position,
  newImpact: DragImpact,
|}

const origin: Position = { x: 0, y: 0 };

export default ({
  destination,
  draggable,
  previousPageCenter,
  newPageCenter,
  newImpact,
}: Args): Result => {
  const isTotallyVisible: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination,
    newPageCenter,
    viewport: getViewport(),
  });
  const scrollDiff: Position = destination.viewport.closestScrollable ?
    destination.viewport.closestScrollable.scroll.diff.value :
    origin;

  if (isTotallyVisible) {
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
  // The actual scroll required to move into the next place
  const requiredScroll: Position = subtract(requiredDistance, scrollDiff);

  return {
    // Using the previous page center with a new impact
    // as we are not visually moving the Draggable
    pageCenter: previousPageCenter,
    impact: newImpact,
    scrollJumpRequest: requiredScroll,
  };
};
