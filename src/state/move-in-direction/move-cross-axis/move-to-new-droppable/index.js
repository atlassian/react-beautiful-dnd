// @flow
import { type Position } from 'css-box-model';
import toHomeList from './to-home-list';
import toForeignList from './to-foreign-list';
import isHomeOf from '../../../droppable/is-home-of';
import type { Result } from '../move-cross-axis-types';
import type {
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Viewport,
  DraggableDimensionMap,
} from '../../../../types';

type Args = {|
  // the current center position of the draggable
  pageBorderBoxCenter: Position,
  // the draggable that is dragging and needs to move
  draggable: DraggableDimension,
  // what the draggable is moving towards
  // can be null if the destination is empty
  moveRelativeTo: ?DraggableDimension,
  // the droppable the draggable is moving to
  destination: DroppableDimension,
  // all the draggables inside the destination
  insideDestination: DraggableDimension[],
  // the impact of a previous drag,
  previousImpact: DragImpact,
  // the viewport
  viewport: Viewport,
  draggables: DraggableDimensionMap,
|};

export default ({
  pageBorderBoxCenter,
  destination,
  insideDestination,
  draggable,
  draggables,
  moveRelativeTo,
  previousImpact,
  viewport,
}: Args): ?Result =>
  isHomeOf(draggable, destination)
    ? // moving back to the home list
      toHomeList({
        moveIntoIndexOf: moveRelativeTo,
        insideDestination,
        draggable,
        draggables,
        destination,
        previousImpact,
        viewport,
      })
    : toForeignList({
        pageBorderBoxCenter,
        moveRelativeTo,
        insideDestination,
        draggable,
        draggables,
        destination,
        previousImpact,
        viewport,
      });
