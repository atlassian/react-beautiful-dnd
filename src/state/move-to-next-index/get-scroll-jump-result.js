// @flow
import { subtract } from '../position';
import type { Result } from './move-to-next-index-types';
import type {
  Position,
  DroppableDimension,
  DragImpact,
} from '../../types';

type Args = {|
  newPageCenter: Position,
  previousPageCenter: Position,
  droppable: DroppableDimension,
  previousImpact: DragImpact,
|}

const origin: Position = { x: 0, y: 0 };

export default ({
  newPageCenter,
  previousPageCenter,
  droppable,
  previousImpact,
}: Args): Result => {
  // The full distance required to get from the previous page center to the new page center
  const requiredDistance: Position = subtract(newPageCenter, previousPageCenter);

  // We need to consider how much the droppable scroll has changed
  const scrollDiff: Position = droppable.viewport.closestScrollable ?
    droppable.viewport.closestScrollable.scroll.diff.value :
    origin;

  // The actual scroll required to move into the next place
  const requiredScroll: Position = subtract(requiredDistance, scrollDiff);

  return {
    // Using the previous page center with a new impact
    // as we are not visually moving the Draggable
    pageCenter: previousPageCenter,
    impact: previousImpact,
    scrollJumpRequest: requiredScroll,
  };
};

