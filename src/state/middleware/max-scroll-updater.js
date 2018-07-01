// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type { State, Viewport } from '../../types';
import type { Action, Store } from '../store-types';
import getMaxScroll from '../get-max-scroll';
import { isEqual } from '../position';
import { updateViewportMaxScroll } from '../action-creators';

const shouldCheckMaxScroll = (action: Action): boolean =>
  action.type === 'MOVE' ||
  action.type === 'MOVE_UP' ||
  action.type === 'MOVE_RIGHT' ||
  action.type === 'MOVE_DOWN' ||
  action.type === 'MOVE_LEFT' ||
  action.type === 'MOVE_BY_WINDOW_SCROLL';

const getNewMaxScroll = (store: Store, action: Action): ?Position => {
  const state: State = store.getState();

  if (!state.isDragging) {
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

  if (isEqual(maxScroll, viewport.scroll.max)) {
    return null;
  }

  // max scroll has changed - updating before action
  return maxScroll;
  // next(updateViewportMaxScroll(maxScroll));
  // next(action);
};

export default (store: Store) => (next: Action => mixed) => (
  action: Action,
): mixed => {
  const initial: State = store.getState();
  if (!initial.isDragging) {
    next(action);
    return;
  }

  const maxScroll: ?Position = getNewMaxScroll(store, action);

  // max scroll has changed - updating before action
  if (maxScroll) {
    next(updateViewportMaxScroll(maxScroll));
  }

  next(action);
};
