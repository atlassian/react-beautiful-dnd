// @flow
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import { noMovement } from './no-impact';
import type {
  DraggableLocation,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  DragImpact,
} from '../types';

type Args = {|
  draggable: DraggableDimension,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap
|}

export default ({
  draggable,
  droppable,
  draggables,
}: Args): ?DragImpact => {
  const insideDroppable: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable,
    draggables,
  );

  const homeIndex: number = insideDroppable.indexOf(draggable);

  if (homeIndex === -1) {
    console.error('lifting a draggable that is not inside a droppable');
    return null;
  }

  const home: DraggableLocation = {
    index: homeIndex,
    droppableId: droppable.id,
  };

  const impact: DragImpact = {
    movement: noMovement,
    direction: droppable.axis.direction,
    destination: home,
  };

  return impact;
};
