// @flow
import moveToEdge from '../../move-to-edge';
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
      source: draggable.page.withoutMargin,
      sourceEdge: 'start',
      destination: droppable.page.withMarginAndPadding,
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

  const newCenter: Position = moveToEdge({
    // Aligning to visible top of draggable
    source: draggable.page.withoutMargin,
    sourceEdge: 'start',
    destination: target.page.withMargin,
    destinationEdge: isGoingBeforeTarget ? 'start' : 'end',
    destinationAxis: axis,
  });

  // Can only displace forward when moving into a foreign list
  // if going before: move everything down including the target
  // if going after: move everything down excluding the target

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
