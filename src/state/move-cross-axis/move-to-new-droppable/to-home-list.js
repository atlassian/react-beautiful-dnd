// @flow
import moveToEdge from '../../move-to-edge';
import type { Edge } from '../../move-to-edge';
import type { Result } from '../move-cross-axis-types';
import type {
  Axis,
  Position,
  DragImpact,
  DraggableId,
  DraggableDimension,
  DroppableDimension,
} from '../../../types';

type Args = {|
  amount: Position,
  originalIndex: number,
  target: ?DraggableDimension,
  insideDroppable: DraggableDimension[],
  draggable: DraggableDimension,
  droppable: DroppableDimension,
|}

export default ({
  amount,
  originalIndex,
  target,
  insideDroppable,
  draggable,
  droppable,
}: Args): ?Result => {
  if (!target) {
    console.error('there will always be a target in the original list');
    return null;
  }

  const axis: Axis = droppable.axis;
  const targetIndex: number = insideDroppable.indexOf(target);

  if (targetIndex === -1) {
    console.error('unable to find target in destination droppable');
    return null;
  }

  // Moving back to original index
  // Super simple - just move it back to the original center with no impact
  if (targetIndex === originalIndex) {
    const newCenter: Position = draggable.page.withoutMargin.center;
    const newImpact: DragImpact = {
      movement: {
        draggables: [],
        amount,
        isBeyondStartPosition: false,
      },
      direction: droppable.axis.direction,
      destination: {
        droppableId: droppable.descriptor.id,
        index: originalIndex,
      },
    };

    return {
      pageCenter: newCenter,
      impact: newImpact,
    };
  }

  // When moving *before* where the item started:
  // We align the dragging item top of the target
  // and move everything from the target to the original position forwards

  // When moving *after* where the item started:
  // We align the dragging item to the end of the target
  // and move everything from the target to the original position backwards

  const isMovingPastOriginalIndex = targetIndex > originalIndex;
  const edge: Edge = isMovingPastOriginalIndex ? 'end' : 'start';

  const newCenter: Position = moveToEdge({
    source: draggable.page.withoutMargin,
    sourceEdge: edge,
    destination: isMovingPastOriginalIndex ? target.page.withoutMargin : target.page.withMargin,
    destinationEdge: edge,
    destinationAxis: axis,
  });

  const needsToMove: DraggableId[] = (() => {
    if (!isMovingPastOriginalIndex) {
      return insideDroppable.slice(targetIndex, originalIndex);
    }

    // We are aligning to the bottom of the target and moving everything
    // back to the original index backwards

    // We want everything after the original index to move
    const from: number = originalIndex + 1;
    // We need the target to move backwards
    const to: number = targetIndex + 1;

    // Need to ensure that the list is sorted with the closest item being first
    return insideDroppable.slice(from, to).reverse();
  })().map((d: DraggableDimension): DraggableId => d.descriptor.id);

  const newImpact: DragImpact = {
    movement: {
      draggables: needsToMove,
      amount,
      isBeyondStartPosition: isMovingPastOriginalIndex,
    },
    direction: axis.direction,
    destination: {
      droppableId: droppable.descriptor.id,
      index: targetIndex,
    },
  };

  return {
    pageCenter: newCenter,
    impact: newImpact,
  };
};
