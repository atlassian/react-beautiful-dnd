// @flow
import memoizeOne from 'memoize-one';
import { getRect, type Rect, type Position } from 'css-box-model';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import isPositionInFrame from './visibility/is-position-in-frame';
import { patch } from './position';
import { expandByPosition } from './spacing';
import { clip } from './droppable-dimension';
import { toDroppableList } from './dimension-structures';
import type {
  Scrollable,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
} from '../types';

const getRequiredGrowth = memoizeOne(
  (
    draggable: DraggableDimension,
    draggables: DraggableDimensionMap,
    droppable: DroppableDimension,
  ): ?Position => {
    // We can't always simply add the placeholder size to the droppable size.
    // If a droppable has a min-height there will be scenarios where it has
    // some items in it, but not enough to completely fill its size.
    // In this case - when the droppable already contains excess space - we
    // don't need to add the full placeholder size.

    const getResult = (existingSpace: number): ?Position => {
      // this is the space required for a placeholder
      const requiredSpace: number =
        draggable.page.marginBox[droppable.axis.size];

      if (requiredSpace <= existingSpace) {
        return null;
      }
      const requiredGrowth: Position = patch(
        droppable.axis.line,
        requiredSpace - existingSpace,
      );

      return requiredGrowth;
    };

    const dimensions: DraggableDimension[] = getDraggablesInsideDroppable(
      droppable,
      draggables,
    );

    // Droppable is empty
    if (!dimensions.length) {
      const existingSpace: number =
        droppable.page.marginBox[droppable.axis.size];
      return getResult(existingSpace);
    }

    // Droppable has items in it

    const endOfDraggables: number =
      dimensions[dimensions.length - 1].page.marginBox[droppable.axis.end];
    const endOfDroppable: number = droppable.page.marginBox[droppable.axis.end];
    const existingSpace: number = endOfDroppable - endOfDraggables;

    return getResult(existingSpace);
  },
);

type GetBufferedDroppableArgs = {
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppable: DroppableDimension,
  previousDroppableOverId: ?DroppableId,
};

// TODO: should only expand on the main axis
const getWithGrowth = memoizeOne(
  (area: Rect, growth: Position): Rect =>
    getRect(expandByPosition(area, growth)),
);

const getClippedRectWithPlaceholder = ({
  draggable,
  draggables,
  droppable,
  previousDroppableOverId,
}: GetBufferedDroppableArgs): ?Rect => {
  const isHome: boolean =
    draggable.descriptor.droppableId === droppable.descriptor.id;
  const wasOver: boolean = Boolean(
    previousDroppableOverId &&
      previousDroppableOverId === droppable.descriptor.id,
  );
  const clippedPageMarginBox: ?Rect = droppable.viewport.clippedPageMarginBox;

  // clipped area is totally hidden behind frame
  if (!clippedPageMarginBox) {
    return clippedPageMarginBox;
  }

  // We only include the placeholder size if it's a
  // foreign list and is currently being hovered over
  if (isHome || !wasOver) {
    return clippedPageMarginBox;
  }

  const requiredGrowth: ?Position = getRequiredGrowth(
    draggable,
    draggables,
    droppable,
  );

  if (!requiredGrowth) {
    return clippedPageMarginBox;
  }

  const subjectWithGrowth: Rect = getWithGrowth(
    clippedPageMarginBox,
    requiredGrowth,
  );
  const closestScrollable: ?Scrollable = droppable.viewport.closestScrollable;

  // The droppable has no scroll container
  if (!closestScrollable) {
    return subjectWithGrowth;
  }

  // We are not clipping the subject
  if (!closestScrollable.shouldClipSubject) {
    return subjectWithGrowth;
  }

  // We need to clip the new subject by the frame which does not change
  // This will allow the user to continue to scroll into the placeholder
  return clip(closestScrollable.framePageMarginBox, subjectWithGrowth);
};

type Args = {|
  target: Position,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  previousDroppableOverId: ?DroppableId,
|};

export default ({
  target,
  draggable,
  draggables,
  droppables,
  previousDroppableOverId,
}: Args): ?DroppableId => {
  const maybe: ?DroppableDimension = toDroppableList(droppables)
    // only want enabled droppables
    .filter((droppable: DroppableDimension) => droppable.isEnabled)
    .filter(
      (droppable: DroppableDimension): boolean => {
        // If previously dragging over a droppable we give it a
        // bit of room on the subsequent drags so that user and move
        // items in the space that the placeholder takes up
        const withPlaceholder: ?Rect = getClippedRectWithPlaceholder({
          draggable,
          draggables,
          droppable,
          previousDroppableOverId,
        });

        if (!withPlaceholder) {
          return false;
        }

        // Not checking to see if visible in viewport
        // as the target might be off screen if dragging a large draggable
        // Not adjusting target for droppable scroll as we are just checking
        // if it is over the droppable - not its internal impact
        return isPositionInFrame(withPlaceholder)(target);
      },
    )
    .sort(
      (a, b): number => {
        if (
          a.client.contentBox[a.axis.size] < b.client.contentBox[b.axis.size]
        ) {
          return -1;
        }

        if (
          a.client.contentBox[a.axis.size] > b.client.contentBox[b.axis.size]
        ) {
          return 1;
        }

        return 0;
      },
    )
    .find((droppable: DroppableDimension): boolean => !!droppable);

  return maybe ? maybe.descriptor.id : null;
};
