// @flow
import memoizeOne from 'memoize-one';
import { distance } from './position';
import type {
  Axis,
  Position,
  DimensionFragment,
  DraggableId,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
} from '../types';

type DroppableCornerMap = {|
  [id: DroppableId]: Position[],
|}

type GetBestDroppableArgs = {|
  draggableId: DraggableId,
  center: Position,
  isMovingForward: boolean,
  plane: 'main-axis' | 'cross-axis',
  // the droppable the draggable is currently in
  droppableId: DroppableId,
  droppables: DroppableDimensionMap,
  draggables: DraggableDimensionMap,
|}

const sortOnCrossAxis = memoizeOne(
  (droppables: DroppableDimensionMap, axis: Axis): DroppableDimension[] =>
    Object.keys(droppables)
      .map((key: DroppableId): DroppableDimension => droppables[key])
      .sort((a: DroppableDimension, b: DroppableDimension) => (
        a.page.withMargin[axis.crossAxisStart] - b.page.withMargin[axis.crossAxisStart]
      )
  )
);

type IsWithResultFn = (number) => boolean;

const isWithin = (lowerBound: number, upperBound: number): IsWithResultFn =>
  (value: number): boolean => value <= upperBound && value >= lowerBound;

export default ({
  isMovingForward,
  draggableId,
  center,
  droppableId,
  droppables,
  draggables,
}: GetBestDroppableArgs): ?DroppableId => {
  const draggable: DraggableDimension = draggables[draggableId];
  const source: DroppableDimension = droppables[droppableId];
  const axis: Axis = source.axis;

  const sorted: DroppableDimension[] = sortOnCrossAxis(droppables, axis);

  const candidates: DroppableDimension[] =
    // 1. Remove the source droppable from the list
    sorted.filter((droppable: DroppableDimension): boolean => droppable !== source)
    // 2. Get only droppables that are on the desired side
    .filter((droppable: DroppableDimension): boolean => {
      if (isMovingForward) {
        // is the droppable in front of the source on the cross axis?
        return source.page.withMargin[axis.crossAxisEnd] <=
          droppable.page.withMargin[axis.crossAxisStart];
      }
      // is the droppable behind the source on the cross axis?
      return droppable.page.withMargin[axis.crossAxisEnd] <=
        source.page.withMargin[axis.crossAxisStart];
    })
    // 3. is there any overlap on the main axis?
    .filter((droppable: DroppableDimension): boolean => {
      const sourceFragment: DimensionFragment = source.page.withMargin;
      const destinationFragment: DimensionFragment = droppable.page.withMargin;

      const isBetweenSourceBounds = isWithin(
        sourceFragment[axis.start],
        sourceFragment[axis.end]
      );
      const isBetweenDestBounds = isWithin(
        destinationFragment[axis.start],
        destinationFragment[axis.end]
      );

      return isBetweenSourceBounds(destinationFragment[axis.start]) ||
        isBetweenSourceBounds(destinationFragment[axis.end]) ||
        isBetweenDestBounds(sourceFragment[axis.start]) ||
        isBetweenDestBounds(sourceFragment[axis.end]);
    })
    // 4. Find the droppables that have the same cross axis value as the first item
    .filter((droppable: DroppableDimension, index: number, array: DroppableDimension[]): boolean =>
      droppable.page.withMargin[axis.crossAxisStart] ===
      array[0].page.withMargin[axis.crossAxisStart]
    );

  // no possible candidates
  if (!candidates.length) {
    return null;
  }

  // only one result - all done!
  if (candidates.length === 1) {
    return candidates[0].id;
  }

  // At this point we have a number of candidates that
  // all have the same axis.crossAxisStart value.
  // Now need to consider the main axis as a tiebreaker

  // 1. Get the distance to all of the corner points
  // 2. Find the closest corner to current center
  // 3. in the event of a tie: choose the corner that is closest to {x: 0, y: 0}
  const items: DroppableDimension[] =
    candidates.map((droppable: DroppableDimension): DroppableCornerMap => {
      const fragment: DimensionFragment = droppable.page.withMargin;
      const first: Position = {
        x: fragment[axis.crossAxisStart],
        y: fragment[axis.start],
      };
      const second: Position = {
        x: 2,
        y: 3,
      };
      return {
        [droppable.id]: [first, second],
      };
    });
};
