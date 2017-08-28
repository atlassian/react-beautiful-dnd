// @flow
import type { DraggableDimension } from '../../types';
// This functions responsibility is to move a draggable above/below a draggable
type Args = {|
|}

export default ({
  source,
  destination,
}: Args): Result => {
  // Moving to an empty droppable
  const isGoingBefore: boolean = center[source.axis.line] < closestSibling.page.withMargin.center[source.axis.line];

  if (!target) {

  }

  // Moving to a populated droppable

  // 1. If isGoingBefore: need to move draggable start edge to start edge of target
  // Then need to move the target and everything after it forward
  // 2. If is going after: need to move draggable start edge to the end of the target
  // Then need to move everything after the target forward
};
