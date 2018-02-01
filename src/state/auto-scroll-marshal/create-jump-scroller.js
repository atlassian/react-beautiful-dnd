// @flow
import { add } from '../position';
import getWindowScrollPosition from '../../view/get-window-scroll-position';
import isTooBigToAutoScroll from './is-too-big-to-auto-scroll';
import getViewport from '../visibility/get-viewport';
import { move as moveAction } from '../action-creators';
import {
  canScrollDroppable,
  canScrollWindow,
  getWindowOverlap,
  getDroppableOverlap,
} from './can-scroll';
import type {
  DroppableId,
  DragState,
  DroppableDimension,
  Position,
  State,
  DraggableLocation,
  DraggableDimension,
  ClosestScrollable,
} from '../../types';

type Args = {|
  scrollDroppable: (id: DroppableId, offset: Position) => void,
  scrollWindow: (offset: Position) => void,
  move: typeof moveAction,
|}

export type JumpScroller = (state: State) => void;

export default ({
  move,
  scrollDroppable,
  scrollWindow,
}: Args): JumpScroller => {
  const moveByOffset = (state: State, offset: Position) => {
    const drag: ?DragState = state.drag;
    if (!drag) {
      return;
    }

    const client: Position = add(drag.current.client.selection, offset);
    move(drag.initial.descriptor.id, client, getWindowScrollPosition(), true);
  };

  const jumpScroller: JumpScroller = (state: State) => {
    const drag: ?DragState = state.drag;

    if (!drag) {
      return;
    }

    const request: ?Position = drag.scrollJumpRequest;

    if (!request) {
      return;
    }

    const draggable: DraggableDimension = state.dimension.draggable[drag.initial.descriptor.id];
    const destination: ?DraggableLocation = drag.impact.destination;

    if (!destination) {
      console.error('Cannot perform a jump scroll when there is no destination');
      return;
    }

    const droppable: DroppableDimension = state.dimension.droppable[destination.droppableId];
    const closestScrollable: ?ClosestScrollable = droppable.viewport.closestScrollable;

    if (closestScrollable) {
      if (isTooBigToAutoScroll(closestScrollable.frame, draggable.page.withMargin)) {
        moveByOffset(state, request);
        return;
      }

      if (canScrollDroppable(droppable, request)) {
        // not scheduling - jump requests need to be performed instantly

        // if the window can also not be scrolled - adjust the item
        if (!canScrollWindow(request)) {
          const overlap: ?Position = getDroppableOverlap(droppable, request);

          if (overlap) {
            console.warn('DROPPABLE OVERLAP', overlap);
            moveByOffset(state, overlap);
          }
        }

        scrollDroppable(droppable.descriptor.id, request);
        return;
      }

      // can now check if we need to scroll the window
    }

    // Scroll the window if we can

    if (isTooBigToAutoScroll(getViewport(), draggable.page.withMargin)) {
      moveByOffset(state, request);
      return;
    }

    if (!canScrollWindow(request)) {
      console.warn('Jump scroll requested but it cannot be done by Droppable or the Window');
      moveByOffset(state, request);
      return;
    }

    const overlap: ?Position = getWindowOverlap(request);

    if (overlap) {
      console.warn('WINDOW OVERLAP', overlap);
      moveByOffset(state, overlap);
    }

    // not scheduling - jump requests need to be performed instantly
    scrollWindow(request);
  };

  return jumpScroller;
};
