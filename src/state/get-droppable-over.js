// @flow
import memoizeOne from 'memoize-one';
import { getFragment } from './dimension';
import getClientRect from './get-client-rect';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import { isPointWithinDroppable } from './is-within-visible-bounds-of-droppable';
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
} from '../types';

const noBuffer: Position = { x: 0, y: 0 };

const bufferDimensionFragment = (buffer: Position) => (fragment: DimensionFragment) => (
  getFragment(getClientRect(addPosition(fragment, buffer)))
);

const addBufferToDroppableDimension = memoizeOne((
  buffer: Position,
  droppable: DroppableDimension
): DroppableDimension => {
  const { id, axis, isEnabled, client, container, page } = droppable;
  const withBuffer = bufferDimensionFragment(buffer);

  const newClient = {
    withoutMargin: withBuffer(client.withoutMargin),
    withMargin: withBuffer(client.withMargin),
    withMarginAndPadding: withBuffer(client.withMarginAndPadding),
  };

  const newPage = {
    withoutMargin: withBuffer(page.withoutMargin),
    withMargin: withBuffer(page.withMargin),
    withMarginAndPadding: withBuffer(page.withMarginAndPadding),
  };

  // We only want to add the buffer to the container dimensions
  // if the droppable isn't clipped by a scroll container
  const shouldBufferContainer = droppable.page.withMargin[droppable.axis.size] <=
    droppable.container.bounds[droppable.axis.size];
  const newContainerBounds = shouldBufferContainer
    ? withBuffer(container.bounds)
    : { ...container.bounds };

  return {
    id,
    axis,
    isEnabled,
    client: newClient,
    page: newPage,
    container: {
      scroll: container.scroll,
      bounds: newContainerBounds,
    },
  };
});

const calculateBufferSize = memoizeOne((
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppable: DroppableDimension,
) => {
  // We can't always simply add the placeholder size to the droppable size.
  // If a droppable has a min-height there will be scenarios where it has
  // some items in it, but not enough to completely fill its size.
  // In this case - when the droppable already contains excess space - we
  // don't need to add the full placeholder size.

  const draggablesInDroppable = getDraggablesInsideDroppable(droppable, draggables);

  if (!draggablesInDroppable.length) {
    return noBuffer;
  }
  const excessSpace = droppable.page.withMargin[droppable.axis.end] -
    draggablesInDroppable[draggablesInDroppable.length - 1]
      .page.withMargin[droppable.axis.end];
  const bufferSize = Math.max(
    draggable.page.withMargin[droppable.axis.size] - excessSpace,
    0
  );

  const buffer = patch(droppable.axis.line, bufferSize);

  return buffer;
});

type GetBufferedDroppableArgs = {
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppable: DroppableDimension,
  previousDroppableOverId: ?DroppableId,
};

const bufferDroppable = ({
  draggable,
  draggables,
  droppable,
  previousDroppableOverId,
}: GetBufferedDroppableArgs): DroppableDimension => {
  const isHomeDroppable = draggable.droppableId === droppable.id;
  const isCurrentlyHovered = previousDroppableOverId &&
    previousDroppableOverId === droppable.id;

  // We only include the placeholder size if it's a
  // foreign list and is currently being hovered over
  if (isHomeDroppable || !isCurrentlyHovered) {
    return droppable;
  }

  const buffer = calculateBufferSize(draggable, draggables, droppable);

  return addBufferToDroppableDimension(buffer, droppable);
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
        const bufferedDroppable = bufferDroppable({
          draggable, draggables, droppable, previousDroppableOverId,
        });

        return isPointWithinDroppable(bufferedDroppable)(target);
      });

  return maybe ? maybe.id : null;
};
