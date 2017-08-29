// @flow
import { subtract, patch } from '../position';
import type {
  Axis,
  Position,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
} from '../../types';

type Args = {|
  // the center position of the current draggable
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

type Result = {|
  // how far the draggable needs to move to be in its new home
  diff: Position,
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
  // 1. Moving to an empty droppable

  if (!target) {
    // Move to start edge of the destination
    // based on the axis of the destination

    // start edge of draggable needs to line up
    // with start edge of destination
    const newHome: Position = {

    };

    const diff: Position = subtract(center, newHome);

    const impact: DragImpact = {
      movement: {
        draggables: [],
        amount: patch(destinationAxis.line, draggable.page.withMargin[destinationAxis.size]),
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
      diff, impact,
    };
  }

  // 2. Moving to a populated droppable

  // 1. If isGoingBefore: need to move draggable start edge to start edge of target
  // Then need to move the target and everything after it forward
  // 2. If is going after: need to move draggable start edge to the end of the target
  // Then need to move everything after the target forward
  const isGoingBefore: boolean = center[sourceAxis.line] <
    target.page.withMargin.center[sourceAxis.line];

  const newHome =
};
