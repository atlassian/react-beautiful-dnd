// @flow
import moveToEdge from '../../move-to-edge';
import type { Edge } from '../../move-to-edge';
import type { Result } from './move-to-new-droppable-types';
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
  isGoingBeforeTarget: boolean,
  originalIndex: number,
  target: ?DraggableDimension,
  insideDroppable: DraggableDimension[],
  draggable: DraggableDimension,
  droppable: DroppableDimension,
|}

export default ({
  originalIndex,
  target,
  amount,
  insideDroppable,
  draggable,
  droppable,
}: Args): ?Result => {
  console.log('to-home-list.js');
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
        droppableId: droppable.id,
        index: originalIndex,
      },
    };

    return {
      center: newCenter,
      impact: newImpact,
    };
  }

  const isMovingBeyondHome = targetIndex > originalIndex;

  const edge: Edge = isMovingBeyondHome ? 'end' : 'start';

  const newCenter: Position = moveToEdge({
    source: draggable.page.withoutMargin,
    sourceEdge: edge,
    destination: isMovingBeyondHome ? target.page.withoutMargin : target.page.withMargin,
    destinationEdge: edge,
    destinationAxis: axis,
  });

  const needsToMove: DraggableId[] = (() => {
    if (isMovingBeyondHome) {
      return insideDroppable.slice(originalIndex + 1, targetIndex + 1);
    }
    return insideDroppable.slice(targetIndex, originalIndex);
  })()
    .map((d: DraggableDimension): DraggableId => d.id)
    // need to ensure that the list is sorted with the closest item being first
    .reverse();

  console.log('to home list moved', needsToMove);

  const newImpact: DragImpact = {
    movement: {
      draggables: needsToMove,
      amount,
          // TODO: not sure what this should be
      isBeyondStartPosition: isMovingBeyondHome,
    },
    direction: axis.direction,
    destination: {
      droppableId: droppable.id,
      index: targetIndex,
    },
  };

  return {
    center: newCenter,
    impact: newImpact,
  };
};
