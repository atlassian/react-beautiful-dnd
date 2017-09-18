// @flow
import type {
  DraggableId,
  DroppableId,
  DragMovement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
  Position,
} from '../../types';
import { add, subtract, patch } from '../position';

type Args = {|
  pageCenter: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
|}

export default ({
  pageCenter,
  draggable,
  destination,
  insideDestination,
}: Args): DragImpact => {
  const axis: Axis = destination.axis;

  const destinationScrollDiff: Position = subtract(
    destination.scroll.current, destination.scroll.initial
  );

  const currentCenter: Position = add(pageCenter, destinationScrollDiff);

  const moved: DraggableId[] = insideDestination
    .filter((child: DraggableDimension): boolean => {
      // Items will be displaced forward if they sit ahead of the dragging item
      const threshold: number = child.page.withoutMargin[axis.end];
      return threshold > currentCenter[axis.line];
    })
    .map((dimension: DraggableDimension): DroppableId => dimension.id);

  const newIndex: number = insideDestination.length - moved.length;

  const movement: DragMovement = {
    amount: patch(axis.line, draggable.page.withMargin[axis.size]),
    draggables: moved,
    isBeyondStartPosition: false,
  };

  const impact: DragImpact = {
    movement,
    direction: axis.direction,
    destination: {
      droppableId: destination.id,
      index: newIndex,
    },
  };

  return impact;
};
