// @flow
import toHomeList from './to-home-list';
import toForeignList from './to-foreign-list';
import { patch } from '../../position';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import type { Result } from './move-to-new-droppable-types';
import type {
  Position,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableLocation,
  DraggableDimensionMap,
} from '../../../types';

type Args = {|
  // the current center position of the draggable
  center: Position,
  // the draggable that is dragging and needs to move
  draggable: DraggableDimension,
  // what the draggable is moving towards
  // can be null if the destination is empty
  target: ?DraggableDimension,
  // the droppable the draggable is moving to
  destination: DroppableDimension,
  // the source location of the draggable
  home: DraggableLocation,
  // the current drag impact
  impact: DragImpact,
  // all the draggables in the system
  draggables: DraggableDimensionMap,
|}

export default ({
  center,
  destination,
  draggable,
  target,
  home,
  draggables,
}: Args): ?Result => {
  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination, draggables
  );
  const amount: Position = patch(
    destination.axis.line,
    draggable.page.withMargin[destination.axis.size]
  );

  const isGoingBeforeTarget: boolean = Boolean(target &&
    center[destination.axis.line] < target.page.withMargin.center[destination.axis.line]);

  // moving back to the home list
  if (destination.id === draggable.droppableId) {
    return toHomeList({
      amount,
      isGoingBeforeTarget,
      originalIndex: home.index,
      target,
      insideDroppable: insideDestination,
      draggable,
      droppable: destination,
    });
  }

  // moving to a foreign list
  return toForeignList({
    amount,
    isGoingBeforeTarget,
    target,
    insideDroppable: insideDestination,
    draggable,
    droppable: destination,
  });
};
