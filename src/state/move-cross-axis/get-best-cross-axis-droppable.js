// @flow
import { closest } from '../position';
import isWithin from '../is-within';
import type {
  Axis,
  Position,
  DroppableId,
  DimensionFragment,
  DroppableDimension,
  DroppableDimensionMap,
} from '../../types';

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
  pageCenter: Position,
  // the home of the draggable
  source: DroppableDimension,
  // all the droppables in the system
  droppables: DroppableDimensionMap,
|}

export default ({
  isMovingForward,
  pageCenter,
  source,
  droppables,
}: GetBestDroppableArgs): ?DroppableDimension => {
  const axis: Axis = source.axis;

  const candidates: DroppableDimension[] = Object.keys(droppables)
    .map((id: DroppableId) => droppables[id])
    // Remove the source droppable from the list
    .filter((droppable: DroppableDimension): boolean => droppable !== source)
    // Remove any options that are not enabled
    .filter((droppable: DroppableDimension): boolean => droppable.isEnabled)
    // Get only droppables that are on the desired side
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
    // Must have some overlap on the main axis
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
    // Sort on the cross axis
    .sort((a: DroppableDimension, b: DroppableDimension) => {
      const first: number = a.page.withMargin[axis.crossAxisStart];
      const second: number = b.page.withMargin[axis.crossAxisStart];

      if (isMovingForward) {
        return first - second;
      }
      return second - first;
    })
    // Find the droppables that have the same cross axis value as the first item
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
    return candidates[0];
  }

  // At this point we have a number of candidates that
  // all have the same axis.crossAxisStart value.

  // Check to see if the center position is within the size of a Droppable on the main axis
  const contains: DroppableDimension[] = candidates
    .filter((droppable: DroppableDimension) => {
      const isWithinDroppable = isWithin(
        droppable.page.withMargin[axis.start],
        droppable.page.withMargin[axis.end]
      );
      return isWithinDroppable(pageCenter[axis.line]);
    });

  if (contains.length === 1) {
    return contains[0];
  }

  // The center point of the draggable falls on the boundary between two droppables
  if (contains.length > 1) {
    // sort on the main axis and choose the first
    return contains.sort((a: DroppableDimension, b: DroppableDimension) => (
      a.page.withMargin[axis.start] - b.page.withMargin[axis.start]
    ))[0];
  }

  // The center is not contained within any droppable
  // 1. Find the candidate that has the closest corner
  // 2. If there is a tie - choose the one that is first on the main axis
  return candidates.sort((a: DroppableDimension, b: DroppableDimension) => {
    const first = closest(pageCenter, getCorners(a));
    const second = closest(pageCenter, getCorners(b));

    // if the distances are not equal - choose the shortest
    if (first !== second) {
      return first - second;
    }

    // They both have the same distance -
    // choose the one that is first on the main axis
    return a.page.withMargin[axis.start] - b.page.withMargin[axis.start];
  })[0];
};
