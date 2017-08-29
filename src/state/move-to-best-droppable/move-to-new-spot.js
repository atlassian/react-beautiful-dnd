// @flow
import { subtract, patch } from '../position';
import moveToEdge from '../move-to-edge';
import type {
  Axis,
  Position,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
} from '../../types';

type Args = {|
  // the current center position of the draggable
  center: Position,
  // the draggable that is dragging and needs to move
  draggable: DraggableDimension,
  // what the draggable is moving towards
  // can be null if the destination is empty
  target: ?DraggableDimension,
  // the droppable the draggable is currently in
  source: DroppableDimension,
  // the droppable the draggable is moving to
  destination: DroppableDimension,
  // all the draggables in the system
  draggables: DraggableDimensionMap,
|}

export type Result = {|
  // how far the draggable needs to move to be in its new home
  center: Position,
  // The impact of the movement
  impact: DragImpact,
|}

export default ({
  center,
  source,
  destination,
  draggable,
  target,
  draggables,
}: Args): Result => {
  const destinationAxis: Axis = destination.axis;
  const sourceAxis: Axis = source.axis;
  const amount: Position = patch(
    destinationAxis.line,
    draggable.page.withMargin[destinationAxis.size]
  );
  // 1. Moving to an empty droppable

  if (!target) {
    // Move to start edge of the destination
    // based on the axis of the destination

    // start edge of draggable needs to line up
    // with start edge of destination
    const newCenter: Position = moveToEdge({
      source: draggable.page.withMargin,
      sourceEdge: 'start',
      destination: destination.page.withMargin,
      destinationEdge: 'start',
      destinationAxis,
    });

    const impact: DragImpact = {
      movement: {
        draggables: [],
        amount,
        // TODO: not sure what this should be
        isBeyondStartPosition: false,
      },
      direction: destinationAxis.direction,
      destination: {
        droppableId: destination.id,
        index: 0,
      },
    };

    return {
      center: newCenter,
      impact,
    };
  }

  // 2. Moving to a populated droppable

  // 1. If isGoingBefore: need to move draggable start edge to start edge of target
  // Then need to move the target and everything after it forward
  // 2. If is going after: need to move draggable start edge to the end of the target
  // Then need to move everything after the target forward
  const isGoingBeforeTarget: boolean = center[sourceAxis.line] <
    target.page.withMargin.center[sourceAxis.line];

  console.log(`moving ${draggable.id}`);
  console.log('source edge:', isGoingBeforeTarget ? 'end' : 'start');
  console.log('destination edge:', isGoingBeforeTarget ? 'start' : 'end');

  const newCenter: Position = moveToEdge({
    source: draggable.page.withMargin,
    // TODO: source edge will always be start - unless moving to home column?
    sourceEdge: 'start',
    destination: target.page.withMargin,
    destinationEdge: isGoingBeforeTarget ? 'start' : 'end',
    destinationAxis,
  });

  // TODO
  const impact: DragImpact = {
    movement: {
      draggables: [],
      amount,
      // TODO: not sure what this should be
      isBeyondStartPosition: false,
    },
    direction: destinationAxis.direction,
    destination: {
      droppableId: destination.id,
      index: 0,
    },
  };

  return {
    center: newCenter,
    impact,
  };
};
