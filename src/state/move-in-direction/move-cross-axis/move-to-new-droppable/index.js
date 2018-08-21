// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import toHomeList from './to-home-list';
import toForeignList from './to-foreign-list';
import { patch } from '../../../position';
import type { Result } from '../move-cross-axis-types';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableLocation,
  DragImpact,
  Viewport,
} from '../../../../types';

type Args = {|
  // the current center position of the draggable
  pageBorderBoxCenter: Position,
  // the draggable that is dragging and needs to move
  draggable: DraggableDimension,
  // what the draggable is moving towards
  // can be null if the destination is empty
  movingRelativeTo: ?DraggableDimension,
  // the droppable the draggable is moving to
  destination: DroppableDimension,
  // all the draggables inside the destination
  insideDestination: DraggableDimension[],
  // the source location of the draggable
  home: DraggableLocation,
  // the impact of a previous drag,
  previousImpact: DragImpact,
  // the viewport
  viewport: Viewport,
|};

export default ({
  pageBorderBoxCenter,
  destination,
  insideDestination,
  draggable,
  movingRelativeTo,
  home,
  previousImpact,
  viewport,
}: Args): Result => {
  // moving back to the home list
  if (destination.descriptor.id === draggable.descriptor.droppableId) {
    invariant(
      movingRelativeTo,
      'There will always be a target in the original list',
    );

    return toHomeList({
      homeIndex: home.index,
      movingRelativeTo,
      insideDestination,
      draggable,
      destination,
      previousImpact,
      viewport,
    });
  }

  // moving to a foreign list
  return toForeignList({
    pageBorderBoxCenter,
    movingRelativeTo,
    insideDestination,
    draggable,
    destination,
    previousImpact,
    viewport,
  });
};
