// @flow
import type { Position } from 'css-box-model';
import type { State, Viewport } from '../../types';
import type { Action, MiddlewareStore, Dispatch } from '../store-types';
import { isEqual } from '../position';
import { updateViewportMaxScroll } from '../action-creators';
import isMovementAllowed from '../is-movement-allowed';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import getMaxWindowScroll from '../../view/window/get-max-window-scroll';
import { timings } from '../../view/animation';

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

const delay: number =
  timings.outOfTheWay * 1000 + timings.placeholderTransitionDelay * 1000 + 20;

export default (store: MiddlewareStore) => {
  let timeoutId: ?TimeoutID = null;

  const clearUpdateTimeout = () => {
    if (!timeoutId) {
      return;
    }
    clearTimeout(timeoutId);
    timeoutId = null;
  };

  return (next: Dispatch) => (action: Action): any => {
    const previous: State = store.getState();
    next(action);
    const current: State = store.getState();

    if (!current.isDragging) {
      clearUpdateTimeout();
      return;
    }

    if (!wasDestinationChange(previous, current, action)) {
      return;
    }

    // abort any pending timeouts
    clearUpdateTimeout();

    console.log('waiting for max viewport scroll change');
    setTimeout(() => {
      timeoutId = null;

      const latest: State = store.getState();
      if (!latest.isDragging) {
        return;
      }

      const maxScroll: ?Position = getUpdatedViewportMax(latest.viewport);

      if (maxScroll) {
        console.log(
          'updating max viewport scroll',
          latest.viewport.scroll.max,
          maxScroll,
        );
        next(updateViewportMaxScroll({ maxScroll }));
      }
    }, delay);
  };
};
