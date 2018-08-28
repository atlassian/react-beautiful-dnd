// @flow
import invariant from 'tiny-invariant';
import { type Position, type Rect } from 'css-box-model';
import { closest } from '../../position';
import isWithin from '../../is-within';
import { getCorners } from '../../spacing';
import isPartiallyVisibleThroughFrame from '../../visibility/is-partially-visible-through-frame';
import { toDroppableList } from '../../dimension-structures';
import type {
  Axis,
  DroppableDimension,
  DroppableDimensionMap,
  Viewport,
} from '../../../types';

type GetBestDroppableArgs = {|
  isMovingForward: boolean,
  // the current position of the dragging item
  pageBorderBoxCenter: Position,
  // the home of the draggable
  source: DroppableDimension,
  // all the droppables in the system
  droppables: DroppableDimensionMap,
  viewport: Viewport,
|};

const getSafeClipped = (droppable: DroppableDimension): Rect => {
  const rect: ?Rect = droppable.subject.active;

  invariant(rect, 'Cannot get clipped area from droppable');

  return rect;
};

export default ({
  isMovingForward,
  pageBorderBoxCenter,
  source,
  droppables,
  viewport,
}: GetBestDroppableArgs): ?DroppableDimension => {
  const active: ?Rect = source.subject.active;

  if (!active) {
    return null;
  }

  const axis: Axis = source.axis;
  const isBetweenSourceClipped = isWithin(active[axis.start], active[axis.end]);
  const candidates: DroppableDimension[] = toDroppableList(droppables)
    // Remove the source droppable from the list
    .filter((droppable: DroppableDimension): boolean => droppable !== source)
    // Remove any options that are not enabled
    .filter((droppable: DroppableDimension): boolean => droppable.isEnabled)
    // Remove any droppables that are not partially visible
    .filter(
      (droppable: DroppableDimension): boolean => {
        const clipped: ?Rect = droppable.subject.active;
        // subject is not visible at all in frame
        if (!clipped) {
          return false;
        }
        // TODO: only need to be totally visible on the cross axis
        return isPartiallyVisibleThroughFrame(viewport.frame)(clipped);
      },
    )
    .filter(
      (droppable: DroppableDimension): boolean => {
        const targetClipped: Rect = getSafeClipped(droppable);

        // is the target in front of the source on the cross axis?
        if (isMovingForward) {
          return active[axis.crossAxisEnd] < targetClipped[axis.crossAxisEnd];
        }
        // is the target behind the source on the cross axis?
        return targetClipped[axis.crossAxisStart] < active[axis.crossAxisStart];
      },
    )
    // Must have some overlap on the main axis
    .filter(
      (droppable: DroppableDimension): boolean => {
        const targetClipped: Rect = getSafeClipped(droppable);

        const isBetweenDestinationClipped = isWithin(
          targetClipped[axis.start],
          targetClipped[axis.end],
        );

        return (
          isBetweenSourceClipped(targetClipped[axis.start]) ||
          isBetweenSourceClipped(targetClipped[axis.end]) ||
          isBetweenDestinationClipped(active[axis.start]) ||
          isBetweenDestinationClipped(active[axis.end])
        );
      },
    )
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
    .filter(
      (
        droppable: DroppableDimension,
        index: number,
        array: DroppableDimension[],
      ): boolean =>
        getSafeClipped(droppable)[axis.crossAxisStart] ===
        getSafeClipped(array[0])[axis.crossAxisStart],
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
  const contains: DroppableDimension[] = candidates.filter(
    (droppable: DroppableDimension) => {
      const isWithinDroppable = isWithin(
        getSafeClipped(droppable)[axis.start],
        getSafeClipped(droppable)[axis.end],
      );
      return isWithinDroppable(pageBorderBoxCenter[axis.line]);
    },
  );

  if (contains.length === 1) {
    return contains[0];
  }

  // The center point of the draggable falls on the boundary between two droppables
  if (contains.length > 1) {
    // sort on the main axis and choose the first
    return contains.sort(
      (a: DroppableDimension, b: DroppableDimension): number =>
        getSafeClipped(a)[axis.start] - getSafeClipped(b)[axis.start],
    )[0];
  }

  // The center is not contained within any droppable
  // 1. Find the candidate that has the closest corner
  // 2. If there is a tie - choose the one that is first on the main axis
  return candidates.sort(
    (a: DroppableDimension, b: DroppableDimension): number => {
      const first = closest(pageBorderBoxCenter, getCorners(getSafeClipped(a)));
      const second = closest(
        pageBorderBoxCenter,
        getCorners(getSafeClipped(b)),
      );

      // if the distances are not equal - choose the shortest
      if (first !== second) {
        return first - second;
      }

      // They both have the same distance -
      // choose the one that is first on the main axis
      return getSafeClipped(a)[axis.start] - getSafeClipped(b)[axis.start];
    },
  )[0];
};
