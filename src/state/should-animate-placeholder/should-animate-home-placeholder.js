// @flow
import type { DroppableId, DragImpact } from '../../types';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';

export default (
  previous: boolean,
  homeId: DroppableId,
  impact: DragImpact,
): boolean => {
  // once it has been animated once, then it will be for the rest of the drag
  if (previous === true) {
    return previous;
  }

  const isOver: ?DroppableId = whatIsDraggedOver(impact);

  // do not animate we over home
  if (isOver === homeId) {
    return false;
  }

  // over nothing - keep the placeholder and don't animate it
  if (isOver == null) {
    return false;
  }

  return true;
};
