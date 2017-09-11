import { getDraggableDimension, getDroppableDimension } from '../../src/state/dimension';
import type {
  DroppableId,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
} from '../../src/types';
import getClientRect from './get-client-rect';

type Rect = {|
  top: number,
  left: number,
  bottom: number,
  right: number,
|};

type CreateDroppableArgs = {|
  direction?: 'vertical' | 'horizontal',
  droppableId: DroppableId,
  droppableRect: Rect,
  draggableRects: Rect[],
|};

type TestDroppable = {
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
}: CreateDroppableArgs): TestDroppable => {
  const droppable = getDroppableDimension({
    id: droppableId,
    direction,
    clientRect: getClientRect(droppableRect),
  });

  const draggableDimensions = draggableRects.map(
    (draggableRect, index) => getDraggableDimension({
      id: `${droppableId}::drag-${index}`,
      droppableId,
      clientRect: getClientRect(draggableRect),
    })
  );

  const draggables = draggableDimensions.reduce(
    (currentDraggables, draggable) => ({
      ...currentDraggables,
      [draggable.id]: draggable,
    }),
    {}
  );

  const draggableIds = Object.keys(draggables);

  return {
    droppableId,
    droppable,
    draggables,
    draggableIds,
    draggableDimensions,
  };
};
