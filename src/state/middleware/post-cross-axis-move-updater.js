// @flow
import type { Position } from 'css-box-model';
import type { State, Viewport } from '../../types';
import type { Action, MiddlewareStore, Dispatch } from '../store-types';
import { isEqual } from '../position';
import { updateViewportMaxScroll, postCrossAxisMove } from '../action-creators';
import isMovementAllowed from '../is-movement-allowed';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import getMaxWindowScroll from '../../view/window/get-max-window-scroll';

const shouldCheckOnAction = (action: Action): boolean =>
  action.type === 'MOVE' ||
  action.type === 'MOVE_UP' ||
  action.type === 'MOVE_RIGHT' ||
  action.type === 'MOVE_DOWN' ||
  action.type === 'MOVE_LEFT' ||
  action.type === 'MOVE_BY_WINDOW_SCROLL';

const wasDestinationChange = (
  previous: State,
  current: State,
  action: Action,
): boolean => {
  if (!shouldCheckOnAction(action)) {
    return false;
  }

  if (!isMovementAllowed(previous) || !isMovementAllowed(current)) {
    return false;
  }

  if (
    whatIsDraggedOver(previous.impact) === whatIsDraggedOver(current.impact)
  ) {
    return false;
  }

  return true;
};

// check to see if the viewport max scroll has changed
const getUpdatedViewportMax = (viewport: Viewport): ?Position => {
  const maxScroll: Position = getMaxWindowScroll();

  // No change in current or max scroll
  if (isEqual(viewport.scroll.max, maxScroll)) {
    return null;
  }

  return maxScroll;
};

export default (store: MiddlewareStore) => (next: Dispatch) => (
  action: Action,
): any => {
  const previous: State = store.getState();
  next(action);
  const current: State = store.getState();

  if (!current.isDragging) {
    return;
  }

  if (!wasDestinationChange(previous, current, action)) {
    return;
  }

  const maxScroll: ?Position = getUpdatedViewportMax(current.viewport);

  if (maxScroll) {
    next(updateViewportMaxScroll({ maxScroll }));
  }

  const isSnapping: boolean = current.movementMode === 'SNAP';

  if (!isSnapping) {
    return;
  }

  // TODO: cancel if no longer needed?
  requestAnimationFrame(() => {
    if (!store.getState().isDragging) {
      return;
    }
    console.warn('POST CROSS AXIS MOVE UPDATE');
    next(postCrossAxisMove());
  });
};
