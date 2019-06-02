// @flow
import { dropAnimationFinished } from '../../action-creators';
import type { State } from '../../../types';
import type { MiddlewareStore, Action, Dispatch } from '../../store-types';
import type { EventBinding } from '../../../view/event-bindings/event-types';
import bindEvents from '../../../view/event-bindings/bind-events';

export default (store: MiddlewareStore) => {
  let unbind: ?() => void = null;
  let frameId: ?AnimationFrameID = null;

  function clear() {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }

    if (unbind) {
      unbind();
      unbind = null;
    }
  }

  return (next: Dispatch) => (action: Action): any => {
    if (
      action.type === 'CLEAN' ||
      action.type === 'DROP_COMPLETE' ||
      action.type === 'DROP_ANIMATION_FINISHED'
    ) {
      clear();
    }

    next(action);

    if (action.type !== 'DROP_ANIMATE') {
      return;
    }

    const binding: EventBinding = {
      eventName: 'scroll',
      // capture: true will catch all scroll events, event from scroll containers
      // once: just in case, we only want to ever fire one
      options: { capture: false, passive: false },
      fn: function flushDropAnimation() {
        const state: State = store.getState();
        if (state.phase === 'DROP_ANIMATING') {
          store.dispatch(dropAnimationFinished());
        }
      },
    };

    // The browser can batch a few scroll events in a single frame
    // including the one that ended the drag.
    // Binding after a requestAnimationFrame ensures that any scrolls caused
    // by the auto scroller are finished
    frameId = requestAnimationFrame(() => {
      unbind = bindEvents(window, [binding]);
    });
  };
};
