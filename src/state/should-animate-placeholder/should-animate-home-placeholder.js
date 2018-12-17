// @flow
import whatIsDraggedOver from '../droppable/what-is-dragged-over';

export default (
  previous: boolean,
  home: DroppableId,
  impact: DragImpact,
): boolean => {
  // once it has been animated once, then it will be for the rest of the drag
  if (previous === true) {
    return previous;
  }

  const isOver: ?DroppableId = whatIsDraggedOver(impact);

  // animate if over a foreign
  const shouldAnimate: boolean = isOver !== home && isOver == null;

  return shouldAnimate;
};
