// @flow
import { closest } from '../position';
import isWithin from '../is-within';
import { getCorners } from '../spacing';
import getViewport from '../visibility/get-viewport';
import isVisibleThroughFrame from '../visibility/is-visible-through-frame';
import type {
  Axis,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
  Position,
  Spacing,
  Area,
} from '../../types';

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
  const sourceClipped: Spacing = source.viewport.clipped;
  const isBetweenSourceClipped = isWithin(
    sourceClipped[axis.start],
    sourceClipped[axis.end]
  );
  const viewport: Area = getViewport();

  // const candidates: Candidate[] = Object.keys(droppables)
  const candidates: DroppableDimension[] = Object.keys(droppables)
    .map((id: DroppableId): DroppableDimension => droppables[id])
    // Remove the source droppable from the list
    .filter((droppable: DroppableDimension): boolean => droppable !== source)
    // Remove any options that are not enabled
    .filter((droppable: DroppableDimension): boolean => droppable.isEnabled)
    // Remove any droppables that are not partially visible
    .filter((droppable: DroppableDimension): boolean => (
      isVisibleThroughFrame(viewport)(droppable.viewport.frame)
    ))
    // Get only droppables that are on the desired side
    .filter((droppable: DroppableDimension): boolean => {
      const targetClipped: Area = droppable.viewport.clipped;

      if (isMovingForward) {
        // is the droppable in front of the source on the cross axis?
        return sourceClipped[axis.crossAxisEnd] <=
          targetClipped[axis.crossAxisStart];
      }
      // is the droppable behind the source on the cross axis?
      return targetClipped[axis.crossAxisEnd] <=
        sourceClipped[axis.crossAxisStart];
    })
    // Must have some overlap on the main axis
    .filter((droppable: DroppableDimension): boolean => {
      const targetClipped: Area = droppable.viewport.clipped;

      const isBetweenDestinationClipped = isWithin(
        targetClipped[axis.start],
        targetClipped[axis.end]
      );

      // TODO: should this be this way or should there be an && in here?
      return isBetweenSourceClipped(targetClipped[axis.start]) ||
        isBetweenSourceClipped(targetClipped[axis.end]) ||
        isBetweenDestinationClipped(sourceClipped[axis.start]) ||
        isBetweenDestinationClipped(sourceClipped[axis.end]);
    })
    // Sort on the cross axis
    .sort((a: DroppableDimension, b: DroppableDimension) => {
      const first: number = a.viewport.clipped[axis.crossAxisStart];
      const second: number = b.viewport.clipped[axis.crossAxisStart];

      if (isMovingForward) {
        return first - second;
      }
      return second - first;
    })
    // Find the droppables that have the same cross axis value as the first item
    .filter((droppable: DroppableDimension, index: number, array: DroppableDimension[]): boolean =>
      droppable.viewport.clipped[axis.crossAxisStart] ===
      array[0].viewport.clipped[axis.crossAxisStart]
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
        droppable.viewport.clipped[axis.start],
        droppable.viewport.clipped[axis.end]
      );
      return isWithinDroppable(pageCenter[axis.line]);
    });

  if (contains.length === 1) {
    return contains[0];
  }

  // The center point of the draggable falls on the boundary between two droppables
  if (contains.length > 1) {
    // sort on the main axis and choose the first
    return contains.sort((a: DroppableDimension, b: DroppableDimension): number => (
      a.viewport.clipped[axis.start] - b.viewport.clipped[axis.start]
    ))[0];
  }

  // The center is not contained within any droppable
  // 1. Find the candidate that has the closest corner
  // 2. If there is a tie - choose the one that is first on the main axis
  return candidates.sort((a: DroppableDimension, b: DroppableDimension): number => {
    const first = closest(pageCenter, getCorners(a.viewport.clipped));
    const second = closest(pageCenter, getCorners(b.viewport.clipped));

    // if the distances are not equal - choose the shortest
    if (first !== second) {
      return first - second;
    }

    // They both have the same distance -
    // choose the one that is first on the main axis
    return a.viewport.clipped[axis.start] - b.viewport.clipped[axis.start];
  })[0];
};
