// @flow
import moveToEdge from '../../move-to-edge';
import type { Result } from '../move-cross-axis-types';
import getDisplacement from '../../get-displacement';
import getViewport from '../../../window/get-viewport';
import withDroppableDisplacement from '../../with-droppable-displacement';
import type {
  Axis,
  Position,
  DragImpact,
  Area,
  DraggableDimension,
  DroppableDimension,
  Displacement,
} from '../../../types';

type Args = {|
  amount: Position,
  pageCenter: Position,
  target: ?DraggableDimension,
  insideDroppable: DraggableDimension[],
  draggable: DraggableDimension,
  droppable: DroppableDimension,
  previousImpact: DragImpact,
|}

export default ({
  amount,
  pageCenter,
  target,
  insideDroppable,
  draggable,
  droppable,
  previousImpact,
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
      destination: droppable.page.withoutPadding,
      destinationEdge: 'start',
      destinationAxis: axis,
    });

    const newImpact: DragImpact = {
      movement: {
        displaced: [],
        amount,
        isBeyondStartPosition: false,
      },
      direction: axis.direction,
      destination: {
        droppableId: droppable.descriptor.id,
        index: 0,
      },
    };

    return {
      pageCenter: withDroppableDisplacement(droppable, newCenter),
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

  const viewport: Area = getViewport();
  const displaced: Displacement[] = insideDroppable
    .slice(proposedIndex, insideDroppable.length)
    .map((dimension: DraggableDimension): Displacement => getDisplacement({
      draggable: dimension,
      destination: droppable,
      viewport,
      previousImpact,
    }));

  const newImpact: DragImpact = {
    movement: {
      displaced,
      amount,
      isBeyondStartPosition: false,
    },
    direction: axis.direction,
    destination: {
      droppableId: droppable.descriptor.id,
      index: proposedIndex,
    },
  };

  return {
    pageCenter: withDroppableDisplacement(droppable, newCenter),
    impact: newImpact,
  };
};
