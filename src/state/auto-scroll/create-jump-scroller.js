// @flow
import { add, subtract } from '../position';
import getWindowScrollPosition from '../../window/get-window-scroll';
import isTooBigToAutoScroll from './is-too-big-to-auto-scroll';
import getViewport from '../../window/get-viewport';
import {
  canScrollDroppable,
  canScrollWindow,
  getWindowOverlap,
  getDroppableOverlap,
} from './can-scroll';
import type {
  DraggableId,
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
  move: (
    id: DraggableId,
    client: Position,
    windowScroll: Position,
    shouldAnimate?: boolean
  ) => void,
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

    console.warn('moving by offset', offset);

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

    // 1. Is the draggable too big to auto scroll?
    if (isTooBigToAutoScroll(getViewport(), draggable.page.withMargin)) {
      moveByOffset(state, request);
      return;
    }

    if (closestScrollable) {
      if (isTooBigToAutoScroll(closestScrollable.frame, draggable.page.withMargin)) {
        moveByOffset(state, request);
        return;
      }
    }

    // 1. We scroll the droppable first if we can to avoid the draggable
    // leaving the list

    if (canScrollDroppable(droppable, request)) {
      const overlap: ?Position = getDroppableOverlap(droppable, request);
      // Droppable can absorb the entire scroll request
      if (!overlap) {
        scrollDroppable(droppable.descriptor.id, request);
        return;
      }
      // there is overlap - can the window absorb it?

      const canWindowScrollOverlap: boolean = canScrollWindow(overlap);

      // window cannot absorb overlap: we need to move it
      if (!canWindowScrollOverlap) {
        moveByOffset(state, overlap);
        return;
      }

      // how much can the window aborb?
      const windowOverlap: ?Position = getWindowOverlap(overlap);

      // window can absorb all of the overlap
      if (!windowOverlap) {
        scrollWindow(overlap);
        return;
      }

      // window can only partially absorb overlap
      // need to move the item by the remainder and scroll the window
      moveByOffset(state, windowOverlap);
      scrollWindow(overlap);
      return;
    }

    // 2. Cannot scroll the droppable - can we scroll the window?

    // Cannot scroll the window at all
    if (!canScrollWindow(request)) {
      moveByOffset(state, request);
      return;
    }

    const overlap: ?Position = getWindowOverlap(request);

    // Window can absorb the entire scroll
    if (!overlap) {
      scrollWindow(request);
      return;
    }

    moveByOffset(state, overlap);
    // the amount that the window can actually scroll
    const canScroll: Position = subtract(request, overlap);
    scrollWindow(canScroll);
  };

  return jumpScroller;
};
