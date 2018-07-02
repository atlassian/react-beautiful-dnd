// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type { State, Viewport } from '../../types';
import type { Action, Store } from '../store-types';
import getMaxScroll from '../get-max-scroll';
import { isEqual } from '../position';
import { updateViewportMaxScroll } from '../action-creators';
import isMovementAllowed from '../is-movement-allowed';

const shouldCheckMaxScroll = (action: Action): boolean =>
  action.type === 'MOVE' ||
  action.type === 'MOVE_UP' ||
  action.type === 'MOVE_RIGHT' ||
  action.type === 'MOVE_DOWN' ||
  action.type === 'MOVE_LEFT' ||
  action.type === 'MOVE_BY_WINDOW_SCROLL';

const getNewMaxScroll = (state: State, action: Action): ?Position => {
  if (!isMovementAllowed(state)) {
    return null;
  }

  if (!shouldCheckMaxScroll(action)) {
    return null;
  }

  // check to see if the viewport max scroll has changed
  const viewport: Viewport = state.viewport;

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

  // No change from current max scroll
  if (isEqual(maxScroll, viewport.scroll.max)) {
    return null;
  }

  return maxScroll;
};

export default (store: Store) => (next: Action => mixed) => (
  action: Action,
): mixed => {
  const maxScroll: ?Position = getNewMaxScroll(store.getState(), action);
  // max scroll has changed - updating before action
  if (maxScroll) {
    next(updateViewportMaxScroll(maxScroll));
  }

  next(action);
};
