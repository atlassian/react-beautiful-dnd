// @flow
import { subtract, patch } from '../position';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import moveToEdge from '../move-to-edge';
import noImpact from '../no-impact';
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
    const proposedIndex: number = targetIndex;

    console.group('returning to home list');
    console.log('target index', targetIndex);
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
          index: home.index,
        },
      };
      console.groupEnd();

      return {
        center: newCenter,
        impact: newImpact,
      };
    }

    console.info('returning to original list - but not in original position');
    console.log('is going before target', isGoingBeforeTarget);

    // need to put into the correct position and have the correct impact

    const isMovingBeyondHome = targetIndex > home.index;
    console.log('is moving beyond home', isMovingBeyondHome);

    const isMovingRelativeToSelf = target.id === draggable.id;
    console.log('target id', target.id);

    console.log('is moving relative to self', isMovingRelativeToSelf);

    const sourceEdge = (() => {
      if (isMovingBeyondHome) {
        return isGoingBeforeTarget ? 'end' : 'end';
      }
      return 'start';
    })();

    const destinationEdge = (() => {
      if (isMovingBeyondHome) {
        return isGoingBeforeTarget ? 'end' : 'end';
      }
      return 'start';
    })();

    console.log('source edge', sourceEdge);
    console.log('destination edge', destinationEdge);

    const newCenter: Position = moveToEdge({
      source: draggable.page.withoutMargin,
      sourceEdge,
      destination: target.page.withMargin,
      destinationEdge,
      destinationAxis,
    });

    const needsToMove: DraggableId[] = (() => {
      if (isMovingBeyondHome) {
        console.group('movingBeyondHome');
        console.log('original', insideDestination);
        const result = [...insideDestination];
        // result.splice(home.index, 1);
        console.log('stripped', result);
        return result.slice(home.index + 1, proposedIndex + 1);
        console.groupEnd();
      }
      return insideDestination.slice(proposedIndex, home.index);
    })().map(d => d.id);

    console.log('moved', needsToMove);

    const newImpact: DragImpact = {
      movement: {
        draggables: needsToMove,
        amount,
        // TODO: not sure what this should be
        isBeyondStartPosition: isMovingBeyondHome,
      },
      direction: destinationAxis.direction,
      destination: {
        droppableId: destination.id,
        index: proposedIndex,
      },
    };

    console.log('impact', newImpact);
    console.groupEnd();

    return {
      center: newCenter,
      impact: newImpact,
    };
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

  console.log('cross axis movement', needsToMove);

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
  };

  return {
    center: newCenter,
    impact: newImpact,
  };
};
