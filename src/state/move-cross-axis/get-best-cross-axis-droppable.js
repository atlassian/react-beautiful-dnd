// @flow
import invariant from 'tiny-invariant';
import { closest } from '../position';
import isWithin from '../is-within';
import { getCorners } from '../spacing';
import isPartiallyVisibleThroughFrame from '../visibility/is-partially-visible-through-frame';
import type {
  Axis,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
  Position,
  Area,
  Viewport,
} from '../../types';

type GetBestDroppableArgs = {|
  isMovingForward: boolean,
  // the current position of the dragging item
  pageCenter: Position,
  // the home of the draggable
  source: DroppableDimension,
  // all the droppables in the system
  droppables: DroppableDimensionMap,
  viewport: Viewport,
|}

const getSafeClipped = (droppable: DroppableDimension): Area => {
  const area: ?Area = droppable.viewport.clipped;

  invariant(area, 'Cannot get clipped area from droppable');

  return area;
};

export default ({
  isMovingForward,
  pageCenter,
  source,
  droppables,
  viewport,
}: GetBestDroppableArgs): ?DroppableDimension => {
  const sourceClipped: ?Area = source.viewport.clipped;

  if (!sourceClipped) {
    return null;
  }

  const axis: Axis = source.axis;
  const isBetweenSourceClipped = isWithin(
    sourceClipped[axis.start],
    sourceClipped[axis.end]
  );
  // const candidates: Candidate[] = Object.keys(droppables)
  const candidates: DroppableDimension[] = Object.keys(droppables)
    .map((id: DroppableId): DroppableDimension => droppables[id])
    // Remove the source droppable from the list
    .filter((droppable: DroppableDimension): boolean => droppable !== source)
    // Remove any options that are not enabled
    .filter((droppable: DroppableDimension): boolean => droppable.isEnabled)
    // Remove any droppables that are not partially visible
    .filter((droppable: DroppableDimension): boolean => {
      const clipped: ?Area = droppable.viewport.clipped;
      // subject is not visible at all in frame
      if (!clipped) {
        return false;
      }
      // TODO: only need to be totally visible on the cross axis
      return isPartiallyVisibleThroughFrame(viewport.subject)(clipped);
    })
    .filter((droppable: DroppableDimension): boolean => {
      const targetClipped: Area = getSafeClipped(droppable);

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
      const targetClipped: Area = getSafeClipped(droppable);

      const isBetweenDestinationClipped = isWithin(
        targetClipped[axis.start],
        targetClipped[axis.end]
      );

      return isBetweenSourceClipped(targetClipped[axis.start]) ||
        isBetweenSourceClipped(targetClipped[axis.end]) ||
        isBetweenDestinationClipped(sourceClipped[axis.start]) ||
        isBetweenDestinationClipped(sourceClipped[axis.end]);
    })
    // Sort on the cross axis
    .sort((a: DroppableDimension, b: DroppableDimension) => {
      const first: number = getSafeClipped(a)[axis.crossAxisStart];
      const second: number = getSafeClipped(b)[axis.crossAxisStart];

      if (isMovingForward) {
        return first - second;
      }
      return second - first;
    })
    // Find the droppables that have the same cross axis value as the first item
    .filter((droppable: DroppableDimension, index: number, array: DroppableDimension[]): boolean =>
      getSafeClipped(droppable)[axis.crossAxisStart] ===
      getSafeClipped(array[0])[axis.crossAxisStart]
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
        getSafeClipped(droppable)[axis.start],
        getSafeClipped(droppable)[axis.end]
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
      getSafeClipped(a)[axis.start] - getSafeClipped(b)[axis.start]
    ))[0];
  }

  // The center is not contained within any droppable
  // 1. Find the candidate that has the closest corner
  // 2. If there is a tie - choose the one that is first on the main axis
  return candidates.sort((a: DroppableDimension, b: DroppableDimension): number => {
    const first = closest(pageCenter, getCorners(getSafeClipped(a)));
    const second = closest(pageCenter, getCorners(getSafeClipped(b)));

    // if the distances are not equal - choose the shortest
    if (first !== second) {
      return first - second;
    }

    // They both have the same distance -
    // choose the one that is first on the main axis
    return getSafeClipped(a)[axis.start] - getSafeClipped(b)[axis.start];
  })[0];
};
