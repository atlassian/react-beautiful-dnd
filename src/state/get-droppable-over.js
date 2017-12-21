// @flow
import memoizeOne from 'memoize-one';
import getArea from './get-area';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import isPositionWithin from './visibility/is-position-within';
import { patch } from './position';
import { addPosition } from './spacing';
import type {
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
  Position,
  Area,
} from '../types';

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
  (area: Area, growth: Position): Area => getArea(addPosition(area, growth))
);

const getClippedAreaWithPlaceholder = ({
  draggable,
  draggables,
  droppable,
  previousDroppableOverId,
}: GetBufferedDroppableArgs): Area => {
  const isHomeDroppable: boolean = draggable.descriptor.droppableId === droppable.descriptor.id;
  const isOverDroppable: boolean = Boolean(
    previousDroppableOverId &&
    previousDroppableOverId === droppable.descriptor.id
  );

  const subject: Area = droppable.viewport.subject;
  const frame: Area = droppable.viewport.frame;
  const clipped: Area = droppable.viewport.clipped;

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
        const clipped: Area = getClippedAreaWithPlaceholder({
          draggable, draggables, droppable, previousDroppableOverId,
        });

        // TODO: do with placeholder
        return isPositionWithin(clipped)(target);
      });

  return maybe ? maybe.descriptor.id : null;
};
