// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import { add, subtract } from '../position';
import {
  canScrollWindow,
  canScrollDroppable,
  getWindowOverlap,
  getDroppableOverlap,
} from './can-scroll';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import { type MoveArgs } from '../action-creators';
import type {
  DroppableDimension,
  Viewport,
  DraggingState,
  DroppableId,
} from '../../types';

type Args = {|
  scrollDroppable: (id: DroppableId, change: Position) => void,
  scrollWindow: (offset: Position) => void,
  move: (args: MoveArgs) => mixed,
|};

export type JumpScroller = (state: DraggingState) => void;

type Remainder = Position;

export default ({
  move,
  scrollDroppable,
  scrollWindow,
}: Args): JumpScroller => {
  const moveByOffset = (state: DraggingState, offset: Position) => {
    const client: Position = add(state.current.client.selection, offset);
    move({ client });
  };

  const scrollDroppableAsMuchAsItCan = (
    droppable: DroppableDimension,
    change: Position,
  ): ?Remainder => {
    // Droppable cannot absorb any of the scroll
    if (!canScrollDroppable(droppable, change)) {
      return change;
    }

    const overlap: ?Position = getDroppableOverlap(droppable, change);

    // Droppable can absorb the entire change
    if (!overlap) {
      scrollDroppable(droppable.descriptor.id, change);
      return null;
    }

    // Droppable can only absorb a part of the change
    const whatTheDroppableCanScroll: Position = subtract(change, overlap);
    scrollDroppable(droppable.descriptor.id, whatTheDroppableCanScroll);

    const remainder: Position = subtract(change, whatTheDroppableCanScroll);
    return remainder;
  };

  const scrollWindowAsMuchAsItCan = (
    isWindowScrollAllowed: boolean,
    viewport: Viewport,
    change: Position,
  ): ?Position => {
    if (!isWindowScrollAllowed) {
      return change;
    }

    if (!canScrollWindow(viewport, change)) {
      // window cannot absorb any of the scroll
      return change;
    }

    const overlap: ?Position = getWindowOverlap(viewport, change);

    // window can absorb entire scroll
    if (!overlap) {
      scrollWindow(change);
      return null;
    }

    // window can only absorb a part of the scroll
    const whatTheWindowCanScroll: Position = subtract(change, overlap);
    scrollWindow(whatTheWindowCanScroll);

    const remainder: Position = subtract(change, whatTheWindowCanScroll);
    return remainder;
  };

  const jumpScroller: JumpScroller = (state: DraggingState) => {
    const request: ?Position = state.scrollJumpRequest;

    if (!request) {
      return;
    }

    const destination: ?DroppableId = whatIsDraggedOver(state.impact);
    invariant(
      destination != null,
      'Cannot perform a jump scroll when there is no destination',
    );

    // 1. We scroll the droppable first if we can to avoid the draggable
    // leaving the list

    const droppableRemainder: ?Position = scrollDroppableAsMuchAsItCan(
      state.dimensions.droppables[destination],
      request,
    );

    // droppable absorbed the entire scroll
    if (!droppableRemainder) {
      return;
    }

    const viewport: Viewport = state.viewport;
    const windowRemainder: ?Position = scrollWindowAsMuchAsItCan(
      state.isWindowScrollAllowed,
      viewport,
      droppableRemainder,
    );

    // window could absorb all the droppable remainder
    if (!windowRemainder) {
      return;
    }

    // The entire scroll could not be absorbed by the droppable and window
    // so we manually move whatever is left
    moveByOffset(state, windowRemainder);
  };

  return jumpScroller;
};
