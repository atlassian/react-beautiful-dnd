// @flow
import { closest } from '../position';
import isWithin from '../is-within';
import { getVisibleBounds } from '../is-within-visible-bounds-of-droppable';
import type {
  Axis,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
  Position,
  Spacing,
} from '../../types';

const getCorners = (bounds: Spacing): Position[] => [
  { x: bounds.left, y: bounds.top },
  { x: bounds.right, y: bounds.top },
  { x: bounds.left, y: bounds.bottom },
  { x: bounds.right, y: bounds.bottom },
];

type GetBestDroppableArgs = {|
  isMovingForward: boolean,
  // the current position of the dragging item
  pageCenter: Position,
  // the home of the draggable
  source: DroppableDimension,
  // all the droppables in the system
  droppables: DroppableDimensionMap,
|}

type Candidate = {
  bounds: Spacing,
  droppable: DroppableDimension,
};

export default ({
  isMovingForward,
  pageCenter,
  source,
  droppables,
}: GetBestDroppableArgs): ?DroppableDimension => {
  const axis: Axis = source.axis;
  const sourceBounds: Spacing = getVisibleBounds(source);

  const candidates: Candidate[] = Object.keys(droppables)
    .map((id: DroppableId): DroppableDimension => droppables[id])
    // Remove the source droppable from the list
    .filter((droppable: DroppableDimension): boolean => droppable !== source)
    // Remove any options that are not enabled
    .filter((droppable: DroppableDimension): boolean => droppable.isEnabled)
    // Get the true visible bounds of the droppables.
    // We calculate it once here and pass it on in an
    // object along with the original droppable.
    .map((droppable: DroppableDimension): Candidate => ({
      bounds: getVisibleBounds(droppable),
      droppable,
    }))
    // Get only droppables that are on the desired side
    .filter(({ bounds }: Candidate): boolean => {
      if (isMovingForward) {
        // is the droppable in front of the source on the cross axis?
        return sourceBounds[axis.crossAxisEnd] <=
          bounds[axis.crossAxisStart];
      }
      // is the droppable behind the source on the cross axis?
      return bounds[axis.crossAxisEnd] <=
        sourceBounds[axis.crossAxisStart];
    })
    // Must have some overlap on the main axis
    .filter(({ bounds }: Candidate): boolean => {
      const isBetweenSourceBounds = isWithin(
        sourceBounds[axis.start],
        sourceBounds[axis.end]
      );
      const isBetweenDestinationBounds = isWithin(
        bounds[axis.start],
        bounds[axis.end]
      );

      return isBetweenSourceBounds(bounds[axis.start]) ||
        isBetweenSourceBounds(bounds[axis.end]) ||
        isBetweenDestinationBounds(sourceBounds[axis.start]) ||
        isBetweenDestinationBounds(sourceBounds[axis.end]);
    })
    // Filter any droppables which are obscured by their container
    .filter(({ droppable }: Candidate) => (
      (droppable.page.withoutMargin[axis.crossAxisStart] >=
        droppable.container.bounds[axis.crossAxisStart]) &&
      (droppable.page.withoutMargin[axis.crossAxisEnd] <=
        droppable.container.bounds[axis.crossAxisEnd])
    ))
    // Sort on the cross axis
    .sort(({ bounds: a }: Candidate, { bounds: b }: Candidate) => {
      const first: number = a[axis.crossAxisStart];
      const second: number = b[axis.crossAxisStart];

      if (isMovingForward) {
        return first - second;
      }
      return second - first;
    })
    // Find the droppables that have the same cross axis value as the first item
    .filter(({ bounds }: Candidate, index: number, array: Candidate[]): boolean =>
      bounds[axis.crossAxisStart] ===
      array[0].bounds[axis.crossAxisStart]
    );

  // no possible candidates
  if (!candidates.length) {
    return null;
  }

  // only one result - all done!
  if (candidates.length === 1) {
    return candidates[0].droppable;
  }

  // At this point we have a number of candidates that
  // all have the same axis.crossAxisStart value.

  // Check to see if the center position is within the size of a Droppable on the main axis
  const contains: Candidate[] = candidates
    .filter(({ bounds }: Candidate) => {
      const isWithinDroppable = isWithin(
        bounds[axis.start],
        bounds[axis.end]
      );
      return isWithinDroppable(pageCenter[axis.line]);
    });

  if (contains.length === 1) {
    return contains[0].droppable;
  }

  // The center point of the draggable falls on the boundary between two droppables
  if (contains.length > 1) {
    // sort on the main axis and choose the first
    return contains.sort(({ bounds: a }: Candidate, { bounds: b }: Candidate) => (
      a[axis.start] - b[axis.start]
    ))[0].droppable;
  }

  // The center is not contained within any droppable
  // 1. Find the candidate that has the closest corner
  // 2. If there is a tie - choose the one that is first on the main axis
  return candidates.sort(({ bounds: a }: Candidate, { bounds: b }: Candidate) => {
    const first = closest(pageCenter, getCorners(a));
    const second = closest(pageCenter, getCorners(b));

    // if the distances are not equal - choose the shortest
    if (first !== second) {
      return first - second;
    }

    // They both have the same distance -
    // choose the one that is first on the main axis
    return a[axis.start] - b[axis.start];
  })[0].droppable;
};
