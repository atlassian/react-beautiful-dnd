// @flow
import moveToEdge from '../../move-to-edge';
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
  target: ?DraggableDimension,
  insideDroppable: DraggableDimension[],
  draggable: DraggableDimension,
  droppable: DroppableDimension,
|}

export default ({
  amount,
  isGoingBeforeTarget,
  target,
  insideDroppable,
  draggable,
  droppable,
}: Args): ?Result => {
  console.log('to-foreign-list.js');
  const axis: Axis = droppable.axis;

  // Moving to an empty list

  if (!target) {
    // Move to start edge of the destination
    // based on the axis of the destination

    const newCenter: Position = moveToEdge({
      source: draggable.page.withMargin,
      sourceEdge: 'start',
      destination: droppable.page.withMargin,
      destinationEdge: 'start',
      destinationAxis: axis,
    });

    const newImpact: DragImpact = {
      movement: {
        draggables: [],
        amount,
        isBeyondStartPosition: false,
      },
      direction: axis.direction,
      destination: {
        droppableId: droppable.id,
        index: 0,
      },
    };

    return {
      center: newCenter,
      impact: newImpact,
    };
  }

  // Moving to a populated list

  const targetIndex: number = insideDroppable.indexOf(target);
  const proposedIndex: number = isGoingBeforeTarget ? targetIndex : targetIndex + 1;

  if (targetIndex === -1) {
    console.error('could not find target inside destination');
    return null;
  }
  if (droppable.id === draggable.droppableId) {
    console.error('to-foreign-list handles movement to foreign lists and not home lists');
    return null;
  }

  const newCenter: Position = moveToEdge({
    source: draggable.page.withoutMargin,
    sourceEdge: 'start',
    destination: target.page.withMargin,
    destinationEdge: isGoingBeforeTarget ? 'start' : 'end',
    destinationAxis: axis,
  });

  const needsToMove: DraggableId[] = insideDroppable
    .slice(proposedIndex, insideDroppable.length)
    .map((dimension: DraggableDimension): DraggableId => dimension.id);

  console.log('moved', needsToMove);

  const newImpact: DragImpact = {
    movement: {
      draggables: needsToMove,
      amount,
      isBeyondStartPosition: false,
    },
    direction: axis.direction,
    destination: {
      droppableId: droppable.id,
      index: proposedIndex,
    },
  };

  return {
    center: newCenter,
    impact: newImpact,
  };
};
