// @flow
import type {
  DraggableId,
  DroppableId,
  ClientRect,
  DragMovement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
  Position,
  Displacement,
} from '../../types';
import { add, subtract, patch } from '../position';
import getVisibleViewport from '../get-visible-viewport';
import getDisplacement from '../get-displacement';

type Args = {|
  pageCenter: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
|}

export default ({
  pageCenter,
  draggable,
  destination,
  insideDestination,
  previousImpact,
}: Args): DragImpact => {
  const viewport: ClientRect = getVisibleViewport();
  const axis: Axis = destination.axis;

  const destinationScrollDiff: Position = subtract(
    destination.container.scroll.current, destination.container.scroll.initial
  );

  const currentCenter: Position = add(pageCenter, destinationScrollDiff);

  const displaced: Displacement[] = insideDestination
    .filter((child: DraggableDimension): boolean => {
      // Items will be displaced forward if they sit ahead of the dragging item
      const threshold: number = child.page.withoutMargin[axis.end];
      return threshold > currentCenter[axis.line];
    })
    .map((dimension: DraggableDimension): Displacement => getDisplacement({
      draggable: dimension,
      destination,
      viewport,
      previousImpact,
    }));

  const newIndex: number = insideDestination.length - displaced.length;

  const movement: DragMovement = {
    amount: patch(axis.line, draggable.page.withMargin[axis.size]),
    displaced,
    isBeyondStartPosition: false,
  };

  const impact: DragImpact = {
    movement,
    direction: axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: newIndex,
    },
  };

  return impact;
};
