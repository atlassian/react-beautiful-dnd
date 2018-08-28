// @flow
import type { DroppableId, DragImpact } from '../../types';
import whatIsDraggedOver from './what-is-dragged-over';

export default (droppableId: DroppableId, impact: DragImpact): boolean => {
  const id: ?DroppableId = whatIsDraggedOver(impact);

  return id ? id === droppableId : false;
};
