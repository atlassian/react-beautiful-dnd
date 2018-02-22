// @flow
import type {
  DraggableId,
  Position,
  DragImpact,
  DroppableDimension,
  DraggableDimensionMap,
} from '../../types';

export type Args = {|
  isMovingForward: boolean,
  draggableId: DraggableId,
  previousPageCenter: Position,
  previousImpact: DragImpact,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
|}

export type Result = {|
  // the new page center position of the element
  pageCenter: Position,
  // the impact of the movement
  impact: DragImpact,
  // Any scroll that is required for the movement.
  // If this is present then the pageCenter and impact
  // will just be the same as the previous drag
  scrollJumpRequest: ?Position,
|}
