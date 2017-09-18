// @flow
import type { DraggableId,
  DroppableId,
  DragMovement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  DimensionFragment,
  Axis,
  Position,
} from '../types';
import { add, subtract, patch } from '../position';

// Calculates the net scroll diff along the main axis
// between two droppables with internal scrolling
type GetDroppableScrollDiff = {|
  home: DroppableDimension,
  foreign: DroppableDimension,
  axis: Axis
|}

const getDroppablesScrollDiff = ({
  home,
  foreign,
  axis,
}): number => {
  const homeScrollDiff: number =
    home.scroll.initial[axis.line] -
    home.scroll.current[axis.line];

  const foreignScrollDiff =
    foreign.scroll.initial[axis.line] -
    foreign.scroll.current[axis.line];

  return foreignScrollDiff - homeScrollDiff;
};

// It is the responsibility of this function
// to return the impact of a drag

type Args = {|
  pageCenter: Position,
  draggable: DraggableDimension,
  home: DroppableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
|}

export default ({
  pageCenter,
  draggable,
  home,
  destination,
  insideDestination,
}: Args): DragImpact => {
  const axis: Axis = destination.axis;

  const homeScrollDiff: Position = subtract(
    home.scroll.current, home.scroll.initial
  );
  const destinationScrollDiff: Position = subtract(
    destination.scroll.current, destination.scroll.initial
  );
  // Where the element actually is now
  const currentCenter: Position = add(pageCenter, homeScrollDiff);

  const moved: DraggableId[] = insideDestination
    .filter((child: DraggableDimension): boolean => {
      const fragment: DimensionFragment = child.page.withoutMargin;

      // If we're over a new droppable items will be displaced
      // if they sit ahead of the dragging item
      const scrollDiff = getDroppablesScrollDiff({
        home,
        foreign: destination,
        axis,
      });
      return (currentCenter[axis.line] - scrollDiff) < fragment[axis.end];
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
