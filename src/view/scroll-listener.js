// @flow
import type { Position } from 'css-box-model';
import rafSchd from 'raf-schd';
import bindEvents from './event-bindings/bind-events';
import type { EventBinding } from './event-bindings/event-types';
import getWindowScroll from './window/get-window-scroll';

type OnWindowScroll = (newScroll: Position) => void;

type Args = {|
  onWindowScroll: OnWindowScroll,
|};

type Result = {|
  start: () => void,
  stop: () => void,
|};

function noop() {}

function getWindowScrollBinding(update: () => void): EventBinding {
  return {
    eventName: 'scroll',
    // TODO: should this be different for SNAP dragging?

    // ## Passive: true
    // Eventual consistency is fine because we use position: fixed on the item
    // ## Capture: false
    // Scroll events on elements do not bubble, but they go through the capture phase
    // https://twitter.com/alexandereardon/status/985994224867819520
    // Using capture: false here as we want to avoid intercepting droppable scroll requests
    options: { passive: true, capture: false },
    fn: (event: UIEvent) => {
      // IE11 fix:
      // Scrollable events still bubble up and are caught by this handler in ie11.
      // We can ignore this event
      if (event.currentTarget !== window) {
        return;
      }

      update();
    },
  };
}

export default function getScrollListener({ onWindowScroll }: Args): Result {
  function updateScroll() {
    // letting the update function read the latest scroll when called
    onWindowScroll(getWindowScroll());
  }

  const scheduled: () => void = rafSchd(updateScroll);
  const binding: EventBinding = getWindowScrollBinding(scheduled);
  let unbind: () => void = noop;

  function start() {
    unbind = bindEvents(window, [binding]);
  }
  function stop() {
    scheduled.cancel();
    unbind();
    unbind = noop;
  }

  return { start, stop };
}
