// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type { State, Viewport } from '../../types';
import type { Action, MiddlewareStore, Dispatch } from '../store-types';
import getMaxScroll from '../get-max-scroll';
import { isEqual } from '../position';
import { updateViewportMaxScroll } from '../action-creators';
import isMovementAllowed from '../is-movement-allowed';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import scrollViewport from '../scroll-viewport';

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
const getViewportScrollChange = (viewport: Viewport): ?Viewport => {
  const doc: ?HTMLElement = document.documentElement;
  invariant(doc, 'Could not find document.documentElement');

  const maxScroll: Position = getMaxScroll({
    scrollHeight: doc.scrollHeight,
    scrollWidth: doc.scrollWidth,
    // these cannot change during a drag
    // a resize event will cancel a drag
    width: viewport.frame.width,
    height: viewport.frame.height,
  });

  const currentScroll: Position = getWindowScroll();

  // No change in current or max scroll
  if (
    isEqual(viewport.scroll.max, maxScroll) &&
    isEqual(viewport.scroll.current, currentScroll)
  ) {
    return null;
  }

  const withMax: Viewport = {
    ...viewport,
    scroll: {
      ...viewport.scroll,
      max: maxScroll,
    },
  };

  return scrollViewport(withMax, currentScroll);
};

export default (store: MiddlewareStore) => (next: Dispatch) => (
  action: Action,
): any => {
  next(action);
  // const previous: State = store.getState();
  // next(action);
  // const current: State = store.getState();

  // if (!current.isDragging) {
  //   return;
  // }

  // if (!wasDestinationChange(previous, current, action)) {
  //   return;
  // }

  // const viewport: ?Position = getUpdatedViewport(current.viewport);

  // if (maxScroll) {
  //   next(updateViewportMaxScroll({ maxScroll }));
  // }
};
