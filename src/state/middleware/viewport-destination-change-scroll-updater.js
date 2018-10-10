// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type { State, Viewport } from '../../types';
import type { Action, MiddlewareStore, Dispatch } from '../store-types';
import getMaxScroll from '../get-max-scroll';
import { isEqual, subtract } from '../position';
import {
  postDestinationChange,
  type PostDestinationChangeArgs,
} from '../action-creators';
import isMovementAllowed from '../is-movement-allowed';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import getWindowScroll from '../../view/window/get-window-scroll';
import scrollViewport from '../scroll-viewport';

const shouldCheckOnAction = (action: Action): boolean =>
  action.type === 'MOVE' ||
  action.type === 'MOVE_UP' ||
  action.type === 'MOVE_RIGHT' ||
  action.type === 'MOVE_DOWN' ||
  action.type === 'MOVE_LEFT' ||
  action.type === 'MOVE_BY_DROPPABLE_SCROLL' ||
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
const getViewportScrollChange = (current: Viewport): ?Viewport => {
  const doc: ?HTMLElement = document.documentElement;
  invariant(doc, 'Could not find document.documentElement');

  const maxScroll: Position = getMaxScroll({
    scrollHeight: doc.scrollHeight,
    scrollWidth: doc.scrollWidth,
    // these cannot change during a drag
    // a resize event will cancel a drag
    width: current.frame.width,
    height: current.frame.height,
  });

  const currentScroll: Position = getWindowScroll();

  // No change in current or max scroll
  if (
    isEqual(current.scroll.max, maxScroll) &&
    isEqual(current.scroll.current, currentScroll)
  ) {
    return null;
  }

  const withNewMax: Viewport = {
    ...current,
    scroll: {
      ...current.scroll,
      max: maxScroll,
    },
  };
  const scrolled: Viewport = scrollViewport(withNewMax, currentScroll);
  return scrolled;
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

  const updated: ?Viewport = getViewportScrollChange(current.viewport);

  const args: PostDestinationChangeArgs = {
    viewport: updated,
  };

  // max scroll has changed - updating before action
  setTimeout(() => {
    next(postDestinationChange(args));
  }, 50);
};
