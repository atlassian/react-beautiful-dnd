// @flow
import memoizeOne from 'memoize-one';
import { getFragment } from './dimension';
import getClientRect from './get-client-rect';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import { isPositionPartiallyWithin } from './visibility/is-partially-within';
import { patch } from './position';
import { addPosition } from './spacing';
import type {
  DimensionFragment,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
  Position,
  ClientRect,
} from '../types';

// const bufferDimensionFragment = (buffer: Position) => (spacing: Spacing) => (
//   getFragment(getClientRect(addPosition(spacing, buffer)))
// );

// const getClippedAreaWithBuffer = memoizeOne((
//   buffer: Position,
//   droppable: DroppableDimension
// ): DimensionFragment => {
//   // We only want to add the buffer to the container dimensions
//   // if the droppable isn't clipped by a scroll container

//   const subject: DimensionFragment = droppable.viewport.subject;
//   const frame: ClientRect = droppable.viewport.frame;
//   const clipped: DimensionFragment = droppable.viewport.clipped;

//   const isClipped: boolean = subject[droppable.axis.size] > frame[droppable.axis.size];

//   if (isClipped) {
//     return clipped;
//   }

//   return getFragment(getClientRect(addPosition(clipped, buffer));

//   const { descriptor, axis, isEnabled, client, page } = droppable;
//   const withBuffer = bufferDimensionFragment(buffer);

//   const newClient = {
//     withoutMargin: withBuffer(client.withoutMargin),
//     withMargin: withBuffer(client.withMargin),
//     withMarginAndPadding: withBuffer(client.withMarginAndPadding),
//   };

//   const newPage = {
//     withoutMargin: withBuffer(page.withoutMargin),
//     withMargin: withBuffer(page.withMargin),
//     withMarginAndPadding: withBuffer(page.withMarginAndPadding),
//   };

//   // const shouldBufferContainer = droppable.page.withMargin[droppable.axis.size] <=
//   // droppable.container.bounds[droppable.axis.size];
//   const newContainerBounds = shouldBuffer
//     ? withBuffer(container.bounds)
//     : { ...container.bounds };

//   const clipped: DimensionFragment = (() => {
//     const frame: ClientRect = droppable.viewport.frame;
//     const subject: DimensionFragment = droppable.viewport.subject;
//     // We only want to add the buffer to the container dimensions
//     // if the droppable isn't clipped by a scroll container
//     const isClipped: boolean = subject[droppable.axis.size] < frame[droppable.axis.size];

//     if (!isClipped) {
//       return frame;
//     }

//     return frame;
//   })();

//   const viewport: DroppableDimensionViewport = {
//     frame: clipped,
//     frameScroll: droppable.viewport.frameScroll,
//     subject: droppable.viewport.subject,
//     clipped: clip(clipped, subjectWithBuffer),
//   };

//   return {
//     descriptor,
//     axis,
//     isEnabled,
//     client: newClient,
//     page: newPage,
//     container: {
//       scroll: container.scroll,
//       bounds: newContainerBounds,
//     },
//   };
// });

const getRequiredGrowth = memoizeOne((
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppable: DroppableDimension,
): ?Position => {
  // We can't always simply add the placeholder size to the droppable size.
  // If a droppable has a min-height there will be scenarios where it has
  // some items in it, but not enough to completely fill its size.
  // In this case - when the droppable already contains excess space - we
  // don't need to add the full placeholder size.
  console.warn('breaking cache');
  const dimensions: DraggableDimension[] = getDraggablesInsideDroppable(droppable, draggables);

  if (!dimensions.length) {
    return null;
  }

  const endOfDraggables: number =
    dimensions[dimensions.length - 1].page.withMargin[droppable.axis.end];
  const endOfDroppable: number = droppable.page.withMargin[droppable.axis.end];
  const existingSpace: number = endOfDroppable - endOfDraggables;
  const requiredSpace: number = draggable.page.withMargin[droppable.axis.size];

  if (requiredSpace <= existingSpace) {
    return null;
  }

  const requiredGrowth: Position = patch(droppable.axis.line, requiredSpace - existingSpace);

  return requiredGrowth;
});

type GetBufferedDroppableArgs = {
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppable: DroppableDimension,
  previousDroppableOverId: ?DroppableId,
};

const getWithGrowth = memoizeOne(
  (fragment: DimensionFragment, growth: Position): DimensionFragment =>
    getFragment(getClientRect(addPosition(fragment, growth))
    )
);

const getClippedAreaWithPlaceholder = ({
  draggable,
  draggables,
  droppable,
  previousDroppableOverId,
}: GetBufferedDroppableArgs): DimensionFragment => {
  const isHomeDroppable: boolean = draggable.descriptor.droppableId === droppable.descriptor.id;
  const isOverDroppable: boolean = Boolean(
    previousDroppableOverId &&
    previousDroppableOverId === droppable.descriptor.id
  );

  const subject: DimensionFragment = droppable.viewport.subject;
  const frame: ClientRect = droppable.viewport.frame;
  const clipped: DimensionFragment = droppable.viewport.clipped;

  // We only include the placeholder size if it's a
  // foreign list and is currently being hovered over
  if (isHomeDroppable || !isOverDroppable) {
    return clipped;
  }

  // We only want to add the buffer to the container dimensions
  // if the droppable isn't clipped by a scroll container
  const isClipped: boolean = subject[droppable.axis.size] > frame[droppable.axis.size];
  console.log('is clipped?', isClipped);
  if (isClipped) {
    return clipped;
  }

  const requiredGrowth: ?Position = getRequiredGrowth(draggable, draggables, droppable);
  console.log('required growth', requiredGrowth);

  // no required growth
  if (!requiredGrowth) {
    return clipped;
  }

  console.log('clipped', clipped);
  console.log('with growth', getWithGrowth(clipped, requiredGrowth));

  return getWithGrowth(clipped, requiredGrowth);
};

type Args = {
  target: Position,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  previousDroppableOverId: ?DroppableId,
};

export default ({
  target,
  draggable,
  draggables,
  droppables,
  previousDroppableOverId,
}: Args): ?DroppableId => {
  const maybe: ?DroppableDimension =
    Object.keys(droppables)
      .map((id: DroppableId): DroppableDimension => droppables[id])
      .find((droppable: DroppableDimension): boolean => {
        // Add the size of a placeholder to a droppable's dimensions (if necessary)
        const clipped: DimensionFragment = getClippedAreaWithPlaceholder({
          draggable, draggables, droppable, previousDroppableOverId,
        });

        // TODO: do with placeholder
        return isPositionPartiallyWithin(clipped)(target);
      });

  return maybe ? maybe.descriptor.id : null;
};
