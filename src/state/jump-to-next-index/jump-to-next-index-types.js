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
  impact: DragImpact,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
|}

export type Result = {|
  center: Position,
  impact: DragImpact,
|}
