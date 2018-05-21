// @flow
import { type Position } from 'css-box-model';
import moveToEdge from '../../move-to-edge';
import type { Result } from '../move-cross-axis-types';
import getDisplacement from '../../get-displacement';
import withDroppableDisplacement from '../../with-droppable-displacement';
import type {
  Axis,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  Displacement,
  Viewport,
} from '../../../types';

type Args = {|
  amount: Position,
  pageBorderBoxCenter: Position,
  target: ?DraggableDimension,
  insideDroppable: DraggableDimension[],
  draggable: DraggableDimension,
  droppable: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Viewport,
|}

export default ({
  amount,
  pageBorderBoxCenter,
  target,
  insideDroppable,
  draggable,
  droppable,
  previousImpact,
  viewport,
}: Args): ?Result => {
  const axis: Axis = droppable.axis;
  const isGoingBeforeTarget: boolean = Boolean(target &&
    pageBorderBoxCenter[droppable.axis.line] < target.page.borderBox.center[droppable.axis.line]);

  // Moving to an empty list

  if (!target) {
    // Move to start edge of the destination
    // based on the axis of the destination

    const newCenter: Position = moveToEdge({
      source: draggable.page.borderBox,
      sourceEdge: 'start',
      destination: droppable.page.contentBox,
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
      pageBorderBoxCenter: withDroppableDisplacement(droppable, newCenter),
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
    source: draggable.page.borderBox,
    sourceEdge: 'start',
    destination: target.page.marginBox,
    destinationEdge: isGoingBeforeTarget ? 'start' : 'end',
    destinationAxis: axis,
  });

  // Can only displace forward when moving into a foreign list
  // if going before: move everything down including the target
  // if going after: move everything down excluding the target

  const displaced: Displacement[] = insideDroppable
    .slice(proposedIndex, insideDroppable.length)
    .map((dimension: DraggableDimension): Displacement => getDisplacement({
      draggable: dimension,
      destination: droppable,
      viewport: viewport.frame,
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
    pageBorderBoxCenter: withDroppableDisplacement(droppable, newCenter),
    impact: newImpact,
  };
};
