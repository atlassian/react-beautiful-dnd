import { getDraggableDimension, getDroppableDimension } from '../../src/state/dimension';
import type {
  DroppableId,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  Direction,
} from '../../src/types';
import getClientRect from './get-client-rect';

type Rect = {|
  top: number,
  left: number,
  bottom: number,
  right: number,
|};

type Args = {|
  direction?: Direction,
  droppableId: DroppableId,
  droppableRect: Rect,
  draggableRects: Rect[],
|};

type Result = {
  droppableId: string,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
  draggableIds: string[],
  draggableDimensions: DraggableDimension[],
};

export default ({
  direction = 'vertical',
  droppableId,
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
