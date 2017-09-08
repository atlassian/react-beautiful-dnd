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
  pageCenter: Position,
  target: ?DraggableDimension,
  insideDroppable: DraggableDimension[],
  draggable: DraggableDimension,
  droppable: DroppableDimension,
|}

export default ({
  amount,
  pageCenter,
  target,
  insideDroppable,
  draggable,
  droppable,
}: Args): ?Result => {
  const axis: Axis = droppable.axis;
  const isGoingBeforeTarget: boolean = Boolean(target &&
    pageCenter[droppable.axis.line] < target.page.withMargin.center[droppable.axis.line]);

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
      pageCenter: newCenter,
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
    pageCenter: newCenter,
    impact: newImpact,
  };
};
