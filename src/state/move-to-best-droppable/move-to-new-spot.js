// @flow
import { subtract, patch } from '../position';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import moveToEdge from '../move-to-edge';
import jumpToNextIndex from '../jump-to-next-index';
import type {
  Axis,
  Position,
  DragImpact,
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DraggableLocation,
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
  // the source location of the draggable
  home: DraggableLocation,
  // the current drag impact
  impact: DragImpact,
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
  home,
  impact,
  draggables,
}: Args): ?Result => {
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

    const newImpact: DragImpact = {
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
      impact: newImpact,
    };
  }

  // 2. Moving to a populated droppable

  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination, draggables
  );

  const isGoingBeforeTarget: boolean = center[sourceAxis.line] <
      target.page.withMargin.center[sourceAxis.line];

  const targetIndex: number = insideDestination.indexOf(target);
  const proposedIndex: number = isGoingBeforeTarget ? targetIndex : targetIndex + 1;

  if (targetIndex === -1) {
    console.error('could not find target inside destination');
    return null;
  }

  const isReturningToHomeList = destination.id === draggable.droppableId;

  if (isReturningToHomeList) {
    console.log('returning to home list');
    console.log('proposed index', proposedIndex);
    // returning to original position
    if (targetIndex === home.index) {
      console.log('returning to original position');
      const newCenter: Position = draggable.page.withoutMargin.center;
      const newImpact: DragImpact = {
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
        impact: newImpact,
      };
    }

    // TODO: need to give an appropriate impact!
    // TODO: broken if moving back to list when current list is impacted

    const result = jumpToNextIndex({
      isMovingForward: isGoingBeforeTarget,
      draggableId: draggable.id,
      impact,
      draggables,
      droppable: destination,
    });

    console.log('result moving back home', result);

    return result;

    // const newCenter: Position = moveToEdge({
    //   source: draggable.page.withoutMargin,
    //   sourceEdge: 'start',
    //   destination: target.page.withMargin,
    //   destinationEdge: 'start',
    //   destinationAxis,
    // });

    // const impact: DragImpact = {
    //   draggables: [],
    //   amount,
    //   isBeyondStartPosition: proposedIndex >
    // };

    // return {
    //   center: newCenter,
    //   impact: noImpact,
    // };
  }

  // 1. If isGoingBefore: need to move draggable start edge to start edge of target
  // Then need to move the target and everything after it forward
  // 2. If is going after: need to move draggable start edge to the end of the target
  // Then need to move everything after the target forward
  // const isGoingBeforeTarget: boolean = center[sourceAxis.line] <
  //     target.page.withMargin.center[sourceAxis.line];

  // const proposedIndex: number = isGoingBeforeTarget ? targetIndex : targetIndex + 1;

  const newCenter: Position = moveToEdge({
    source: draggable.page.withoutMargin,
    sourceEdge: 'start',
    destination: target.page.withMargin,
    destinationEdge: isGoingBeforeTarget ? 'start' : 'end',
    destinationAxis,
  });

  // need to get the index of the draggable that we are moving relative to

  const needsToMove: DraggableId[] = insideDestination
    .slice(proposedIndex, insideDestination.length)
    .map((dimension: DraggableDimension): DraggableId => dimension.id);

  const newImpact: DragImpact = {
    movement: {
      draggables: needsToMove,
      amount,
      // TODO: not sure what this should be
      isBeyondStartPosition: false,
    },
    direction: destinationAxis.direction,
    destination: {
      droppableId: destination.id,
      index: proposedIndex,
    },
    foreignDestinationStartIndex: proposedIndex,
  };

  return {
    center: newCenter,
    impact: newImpact,
  };
};
