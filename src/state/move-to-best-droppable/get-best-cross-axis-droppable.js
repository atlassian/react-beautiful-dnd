// @flow
import { closest } from '../position';
import { droppableMapToList } from '../dimension-map-to-list';
import type {
  Axis,
  Position,
  DimensionFragment,
  DroppableId,
  DroppableDimension,
  DroppableDimensionMap,
} from '../../types';

type DistanceToDroppable = {|
  id: DroppableId,
  distance: number,
|}

const isWithin = (lowerBound: number, upperBound: number): ((number) => boolean) =>
  (value: number): boolean => value <= upperBound && value >= lowerBound;

// TODO: could this be done once and not redone each time?
const getCorners = (droppable: DroppableDimension): Position[] => {
  const fragment: DimensionFragment = droppable.page.withMargin;

  return [
    { x: fragment.left, y: fragment.top },
    { x: fragment.right, y: fragment.top },
    { x: fragment.left, y: fragment.bottom },
    { x: fragment.right, y: fragment.bottom },
  ];
};

type GetBestDroppableArgs = {|
  isMovingForward: boolean,
  // the current position of the dragging item
  center: Position,
  // the home of the draggable
  source: DroppableDimension,
  // all the droppables in the system
  droppables: DroppableDimensionMap,
|}

export default ({
  isMovingForward,
  center,
  source,
  droppables,
}: GetBestDroppableArgs): ?DroppableId => {
  const axis: Axis = source.axis;

  const candidates: DroppableDimension[] = droppableMapToList(droppables)
    // 1. Remove the source droppable from the list
    .filter((droppable: DroppableDimension): boolean => droppable !== source)
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
      const isBetweenDestinationBounds = isWithin(
        destinationFragment[axis.start],
        destinationFragment[axis.end]
      );

      return isBetweenSourceBounds(destinationFragment[axis.start]) ||
        isBetweenSourceBounds(destinationFragment[axis.end]) ||
        isBetweenDestinationBounds(sourceFragment[axis.start]) ||
        isBetweenDestinationBounds(sourceFragment[axis.end]);
    })
    // 4. Sort on the cross axis
    .sort((a: DroppableDimension, b: DroppableDimension) => (
      a.page.withMargin[axis.crossAxisStart] - b.page.withMargin[axis.crossAxisStart]
    ))
    // 5. Find the droppables that have the same cross axis value as the first item
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
  const bestId: DroppableId =
    candidates.map((droppable: DroppableDimension): DistanceToDroppable => ({
      id: droppable.id,
      // two of the corners will be redundant, but it is *way* easier
      // to pass every corner than to conditionally grab the right ones
      distance: closest(center, getCorners(droppable)),
    }))
    // 4. Sort on the main axis
    .sort((a: DistanceToDroppable, b: DistanceToDroppable) => (
      a.page.withMargin[axis.start] - b.page.withMargin[axis.end]
    ))
    // the item with the shortest distance will be first
    .sort((a: DistanceToDroppable, b: DistanceToDroppable) => a.distance - b.distance)
    // if there is a tie we return the first - they are already sorted on main axis
    .map(a => a.id)[0];

  return bestId;
};
