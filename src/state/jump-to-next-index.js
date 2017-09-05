// @flow
import memoizeOne from 'memoize-one';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import { patch } from './position';
import moveToEdge from './move-to-edge';
import type { Edge } from './move-to-edge';
import type {
  DraggableLocation,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  Position,
  DraggableId,
  Axis,
  DragImpact,
  DimensionFragment,
} from '../types';

const getIndex = memoizeOne(
  (draggables: DraggableDimension[],
    target: DraggableDimension
  ): number => draggables.indexOf(target)
);

type JumpToNextArgs = {|
  isMovingForward: boolean,
  draggableId: DraggableId,
  impact: DragImpact,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
|}

export type JumpToNextResult = {|
  center: Position,
  impact: DragImpact,
|}
// const pull =

// const pull: ShiftPosition = shift(subtract, size: number);
// const push: ShiftPosition = shift(add, size: number);

export default ({
  isMovingForward,
  draggableId,
  impact,
  droppable,
  draggables,
  }: JumpToNextArgs): ?JumpToNextResult => {
  if (!impact.destination) {
    console.error('cannot move forward when there is not previous destination');
    return null;
  }

  const location: DraggableLocation = impact.destination;
  const draggable: DraggableDimension = draggables[draggableId];
  const axis: Axis = droppable.axis;

  const insideDroppable: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable,
    draggables,
  );

  // has the dragging item moved into a new list?
  const isInHomeList: boolean = draggable.droppableId === droppable.id;

  if (!isInHomeList) {
    console.group('not in home list');
    console.log('not in home list!');
    // if draggable is not in home list
    const currentIndex: number = location.index;
    const proposedIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;
    const startIndex: number = impact.foreignDestinationStartIndex;
    console.log('proposed index', proposedIndex);
    console.log('currentIndex', currentIndex);
    console.log('start index', startIndex);

    // cannot move forward beyond the last item
    if (proposedIndex > insideDroppable.length) {
      return null;
    }

    // cannot move before the first item
    if (proposedIndex < 0) {
      return null;
    }

    console.log('foreignDestinationStartIndex', startIndex);

    const destinationIndex = proposedIndex >= startIndex ? proposedIndex - 1 : proposedIndex - 1;

    console.log('destinationIndex', destinationIndex);

    // the index's need to be adjusted to take into account the additional element
    // 'inserted' at start position
    const destination: DimensionFragment = (() => {
      if (proposedIndex === 0) {
        console.log('destination id', insideDroppable[0].id);
        return insideDroppable[0].page.withMargin;
      }

      console.log('destination id', insideDroppable[destinationIndex].id);
      return insideDroppable[destinationIndex].page.withMargin;
    })();
    const atProposedIndex: DraggableDimension = insideDroppable[proposedIndex];

    // const sourceEdge = isMovingForward ? 'start' : 'end';

    // const destinationEdge = (() => {
    //   if (isMovingToEnd) {
    //     return 'end';
    //   }

    //   return isMovingForward ? 'start' : 'end';
    // })();

    const isMovingTowardStart = (isMovingForward && proposedIndex <= startIndex) ||
      (!isMovingForward && proposedIndex >= startIndex);

    const sourceEdge = (() => {
      if (proposedIndex === 0) {
        console.log('returning custom edge');
        return 'start';
      }

      // is moving away from the start
      if (!isMovingTowardStart) {
        return isMovingForward ? 'start' : 'start';
      }
      // is moving back towards the start
      return isMovingForward ? 'start' : 'start';
    })();

    const destinationEdge = (() => {
      if (proposedIndex === 0) {
        console.log('returning custom edge');
        return 'start';
      }

      // is moving away from the start
      if (!isMovingTowardStart) {
        return isMovingForward ? 'end' : 'end';
      }
      // is moving back towards the start
      return isMovingForward ? 'end' : 'end';
    })();

    console.log('sourceEdge:', sourceEdge);
    console.log('destinationEdge:', destinationEdge);
    // console.log('edge', edge);
    // console.log('is moving forward', isMovingForward);
    // console.log('isMovingTowardStart', isMovingTowardStart);

    const newCenter: Position = moveToEdge({
      source: draggable.page.withoutMargin,
      sourceEdge,
      destination,
      destinationEdge,
      destinationAxis: droppable.axis,
    });

    console.log('is moving towards start', isMovingTowardStart);
    console.log('is moving forward', isMovingForward);

    const moved: DraggableId[] = (() => {
      if (isMovingTowardStart) {
        // if moving backwards towards the start
        if (!isMovingForward) {
          // need to trim the existing movement
          return [atProposedIndex.id, ...impact.movement.draggables];
        }
        return impact.movement.draggables.slice(1, impact.movement.draggables.length);
      }

      // if moving away from start and moving backwards
      if (!isMovingForward) {
        // need to add the destination to the impacted
        return [atProposedIndex.id, ...impact.movement.draggables];
      }

      // is moving away from the start and moving forward
      // need to add the destination to the impacted
      // when moving away we need to trim the impacted as it has already moved down to make room
      return impact.movement.draggables.slice(1, impact.movement.draggables.length);
    })();

    console.log('moved', moved);

    const newImpact: DragImpact = {
      movement: {
        draggables: moved,
          // The amount of movement will always be the size of the dragging item
        amount: patch(axis.line, draggable.page.withMargin[axis.size]),
        isBeyondStartPosition: false,
      },
      destination: {
        droppableId: droppable.id,
        index: proposedIndex,
      },
      direction: droppable.axis.direction,
      foreignDestinationStartIndex: impact.foreignDestinationStartIndex,
    };

    // console.log('returning result', { newCenter, newImpact });

    console.groupEnd();

    return {
      center: newCenter,
      impact: newImpact,
    };
  }

  // even if not in home list -

  // If not in home list - need to insert draggable into correct position in list
  // const tempIndex: number = impact.destination.index;

  console.log('moving when in home list')

  const startIndex: number = getIndex(insideDroppable, draggable);
  const currentIndex: number = location.index;
  const proposedIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;

  if (startIndex === -1) {
    console.error('could not find draggable inside current droppable');
    return null;
  }

  // cannot move forward beyond the last item
  if (proposedIndex > insideDroppable.length - 1) {
    return null;
  }

  // cannot move before the first item
  if (proposedIndex < 0) {
    return null;
  }

  const destination: DraggableDimension = insideDroppable[proposedIndex];
  const isMovingTowardStart = (isMovingForward && proposedIndex <= startIndex) ||
    (!isMovingForward && proposedIndex >= startIndex);

  const edge: Edge = (() => {
    // is moving away from the start
    if (!isMovingTowardStart) {
      return isMovingForward ? 'end' : 'start';
    }
    // is moving back towards the start
    return isMovingForward ? 'start' : 'end';
  })();

  const newCenter: Position = moveToEdge({
    source: draggable.page.withoutMargin,
    sourceEdge: edge,
    destination: destination.page.withoutMargin,
    destinationEdge: edge,
    destinationAxis: droppable.axis,
  });

  // Calculate DragImpact

  // 1. If moving back towards where we started
  // we need to remove the latest addition
  // 2. If we are moving away from where we started,
  // we need to add the next draggable to the impact
  const moved: DraggableId[] = isMovingTowardStart ?
    impact.movement.draggables.slice(0, impact.movement.draggables.length - 1) :
    [...impact.movement.draggables, destination.id];

  console.log('moved', moved);
  console.log('destination', destination);

  const newImpact: DragImpact = {
    movement: {
      draggables: moved,
      // The amount of movement will always be the size of the dragging item
      amount: patch(axis.line, draggable.page.withMargin[axis.size]),
      isBeyondStartPosition: proposedIndex > startIndex,
    },
    destination: {
      droppableId: droppable.id,
      index: proposedIndex,
    },
    direction: droppable.axis.direction,
  };

  const result: JumpToNextResult = {
    center: newCenter,
    impact: newImpact,
  };

  return result;
};

