// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type { State, Viewport } from '../../types';
import type { Action, MiddlewareStore, Dispatch } from '../store-types';
import getMaxScroll from '../get-max-scroll';
import { isEqual, subtract } from '../position';
import {
  updateViewportScrollFromDestinationChange as updateViewportScroll,
  type ViewportScrollChangeFromDestinationChangeArgs as ScrollUpdateArgs,
} from '../action-creators';
import isMovementAllowed from '../is-movement-allowed';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import getWindowScroll from '../../view/window/get-window-scroll';

const shouldCheckOnAction = (action: Action): boolean =>
  action.type === 'MOVE' ||
  action.type === 'MOVE_UP' ||
  action.type === 'MOVE_RIGHT' ||
  action.type === 'MOVE_DOWN' ||
  action.type === 'MOVE_LEFT' ||
  action.type === 'MOVE_BY_WINDOW_SCROLL';

const getNewMaxScroll = (
  previous: State,
  current: State,
  action: Action,
): ?ScrollUpdateArgs => {
  if (!shouldCheckOnAction(action)) {
    return null;
  }

  if (!isMovementAllowed(previous) || !isMovementAllowed(current)) {
    return null;
  }

  // optimisation: body size can only change when the destination has changed
  if (
    whatIsDraggedOver(previous.impact) === whatIsDraggedOver(current.impact)
  ) {
    return null;
  }

  // check to see if the viewport max scroll has changed
  const viewport: Viewport = current.viewport;

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

  const shift: Position = subtract(currentScroll, viewport.scroll.current);

  return {
    current: currentScroll,
    shift,
    max: maxScroll,
  };
};

export default (store: MiddlewareStore) => (next: Dispatch) => (
  action: Action,
): any => {
  const previous: State = store.getState();
  next(action);
  const current: State = store.getState();
  const update: ?ScrollUpdateArgs = getNewMaxScroll(previous, current, action);

  // max scroll has changed - updating before action
  if (update) {
    next(updateViewportScroll(update));
  }
};
