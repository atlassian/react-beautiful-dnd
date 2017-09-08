// @flow
import toHomeList from './to-home-list';
import toForeignList from './to-foreign-list';
import { patch } from '../../position';
import type { Result } from './move-to-new-droppable-types';
import type {
  Position,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableLocation,
} from '../../../types';

type Args = {|
  // the current center position of the draggable
  pageCenter: Position,
  // the draggable that is dragging and needs to move
  draggable: DraggableDimension,
  // what the draggable is moving towards
  // can be null if the destination is empty
  target: ?DraggableDimension,
  // the droppable the draggable is moving to
  destination: DroppableDimension,
  // all the draggables inside the destination
  insideDestination: DraggableDimension[],
  // the source location of the draggable
  home: DraggableLocation,
  // the current drag impact
  impact: DragImpact,
|}

export default ({
  pageCenter,
  destination,
  draggable,
  target,
  home,
  insideDestination,
}: Args): ?Result => {
  const amount: Position = patch(
    destination.axis.line,
    draggable.page.withMargin[destination.axis.size]
  );

  // moving back to the home list
  if (destination.id === draggable.droppableId) {
    return toHomeList({
      amount,
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
    pageCenter,
    target,
    insideDroppable: insideDestination,
    draggable,
    droppable: destination,
  });
};
