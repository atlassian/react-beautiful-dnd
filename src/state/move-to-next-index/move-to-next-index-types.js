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
  previousImpact: DragImpact,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
|}

export type Result = {|
  // the new page center position of the element
  pageCenter: Position,
  // the impact of the movement
  impact: DragImpact,
|}
