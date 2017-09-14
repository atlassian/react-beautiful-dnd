// @flow
import { getDraggableDimension, getDroppableDimension } from '../../src/state/dimension';
import type {
  DroppableId,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  Direction,
  Spacing,
} from '../../src/types';
import getClientRect from '../../src/state/get-client-rect';

type Args = {|
  direction?: Direction,
  droppableId?: DroppableId,
  droppableRect: Spacing,
  draggableRects: Spacing[],
|};

export type Result = {
  droppableId: string,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
  draggableIds: string[],
  draggableDimensions: DraggableDimension[],
};

let idCount = 0;

export default ({
  direction = 'vertical',
  droppableId = `droppable-generated-id-${idCount++}`,
  droppableRect,
  draggableRects,
}: Args): Result => {
  const droppable: DroppableDimension = getDroppableDimension({
    id: droppableId,
    direction,
    clientRect: getClientRect(droppableRect),
  });

  const draggableDimensions: DraggableDimension[] = draggableRects.map(
    (draggableRect, index) => getDraggableDimension({
      id: `${droppableId}::drag-${index}`,
      droppableId,
      clientRect: getClientRect(draggableRect),
    })
  );

  const draggables: DraggableDimensionMap = draggableDimensions.reduce(
    (currentDraggables, draggable) => ({
      ...currentDraggables,
      [draggable.id]: draggable,
    }), {});

  const draggableIds = Object.keys(draggables);

  return {
    droppableId,
    droppable,
    draggables,
    draggableIds,
    draggableDimensions,
  };
};
