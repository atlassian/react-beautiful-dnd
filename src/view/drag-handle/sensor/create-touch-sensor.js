// @flow
/* eslint-disable no-use-before-define */
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import type { EventBinding } from '../util/event-types';
import type { TouchSensor, CreateSensorArgs } from './sensor-types';
import createScheduler from '../util/create-scheduler';
import createPostDragEventPreventer, {
  type EventPreventer,
} from '../util/create-post-drag-event-preventer';
import createEventMarshal, {
  type EventMarshal,
} from '../util/create-event-marshal';
import { bindEvents, unbindEvents } from '../util/bind-events';
import * as keyCodes from '../../key-codes';
import supportedPageVisibilityEventName from '../util/supported-page-visibility-event-name';

type State = {
  isDragging: boolean,
  hasMoved: boolean,
  longPressTimerId: ?TimeoutID,
  pending: ?Position,
};

type TouchWithForce = Touch & {
  force: number,
};

type WebkitHack = {|
  preventTouchMove: () => void,
  releaseTouchMove: () => void,
|};

export const timeForLongPress: number = 150;
export const forcePressThreshold: number = 0.15;
const touchStartMarshal: EventMarshal = createEventMarshal();
const noop = (): void => {};

// Webkit does not allow event.preventDefault() in dynamically added handlers
// So we add an always listening event handler to get around this :(
// webkit bug: https://bugs.webkit.org/show_bug.cgi?id=184250
const webkitHack: WebkitHack = (() => {
  const stub: WebkitHack = {
    preventTouchMove: noop,
    releaseTouchMove: noop,
  };

  // Do nothing when server side rendering
  if (typeof window === 'undefined') {
    return stub;
  }

  // Device has no touch support - no point adding the touch listener
  if (!('ontouchstart' in window)) {
    return stub;
  }

  // Not adding any user agent testing as everything pretends to be webkit

  let isBlocking: boolean = false;

  // Adding a persistent event handler
  window.addEventListener(
    'touchmove',
    (event: TouchEvent) => {
      // We let the event go through as normal as nothing
      // is blocking the touchmove
      if (!isBlocking) {
        return;
      }

      // Our event handler would have worked correctly if the browser
      // was not webkit based, or an older version of webkit.
      if (event.defaultPrevented) {
        return;
      }

      // Okay, now we need to step in and fix things
      event.preventDefault();

      // Forcing this to be non-passive so we can get every touchmove
      // Not activating in the capture phase like the dynamic touchmove we add.
      // Technically it would not matter if we did this in the capture phase
    },
    { passive: false, capture: false },
  );

  const preventTouchMove = () => {
    isBlocking = true;
  };
  const releaseTouchMove = () => {
    isBlocking = false;
  };

  return { preventTouchMove, releaseTouchMove };
})();

const initial: State = {
  isDragging: false,
  pending: null,
  hasMoved: false,
  longPressTimerId: null,
};

export default ({
  callbacks,
  getWindow,
  canStartCapturing,
}: CreateSensorArgs): TouchSensor => {
  let state: State = initial;

  const setState = (partial: Object): void => {
    state = {
      ...state,
      ...partial,
    };
  };
  const isDragging = (): boolean => state.isDragging;
  const isCapturing = (): boolean =>
    Boolean(state.pending || state.isDragging || state.longPressTimerId);
  const schedule = createScheduler(callbacks);
  const postDragEventPreventer: EventPreventer = createPostDragEventPreventer(
    getWindow,
  );

  const startDragging = () => {
    const pending: ?Position = state.pending;

    if (!pending) {
      // cannot use kill() as it will not unbind when there is no pending
      stopPendingDrag();
      invariant(false, 'cannot start a touch drag without a pending position');
    }

    setState({
      isDragging: true,
      // has not moved from original position yet
      hasMoved: false,
      // no longer relevant
      pending: null,
      longPressTimerId: null,
    });

    callbacks.onLift({
      clientSelection: pending,
      movementMode: 'FLUID',
    });
  };
  const stopDragging = (fn?: Function = noop) => {
    schedule.cancel();
    touchStartMarshal.reset();
    webkitHack.releaseTouchMove();
    unbindWindowEvents();
    postDragEventPreventer.preventNext();
    setState(initial);
    fn();
  };

  const startPendingDrag = (event: TouchEvent) => {
    const touch: Touch = event.touches[0];
    const { clientX, clientY } = touch;
    const point: Position = {
      x: clientX,
      y: clientY,
    };

    const longPressTimerId: TimeoutID = setTimeout(
      startDragging,
      timeForLongPress,
    );

    setState({
      longPressTimerId,
      pending: point,
      isDragging: false,
      hasMoved: false,
    });
    bindWindowEvents();
  };

  const stopPendingDrag = () => {
    if (state.longPressTimerId) {
      clearTimeout(state.longPressTimerId);
    }
    schedule.cancel();
    touchStartMarshal.reset();
    webkitHack.releaseTouchMove();
    unbindWindowEvents();

    setState(initial);
  };

  const kill = (fn?: Function = noop) => {
    if (state.pending) {
      stopPendingDrag();
      return;
    }
    if (state.isDragging) {
      stopDragging(fn);
    }
  };

  const unmount = () => {
    kill();
    postDragEventPreventer.abort();
  };

  const cancel = () => {
    kill(callbacks.onCancel);
  };

  const windowBindings: EventBinding[] = [
    {
      eventName: 'touchmove',
      // Opting out of passive touchmove (default) so as to prevent scrolling while moving
      // Not worried about performance as effect of move is throttled in requestAnimationFrame
      options: { passive: false },
      fn: (event: TouchEvent) => {
        // Drag has not yet started and we are waiting for a long press.
        if (!state.isDragging) {
          stopPendingDrag();
          return;
        }

        // At this point we are dragging

        if (!state.hasMoved) {
          setState({
            hasMoved: true,
          });
        }

        const { clientX, clientY } = event.touches[0];

        const point: Position = {
          x: clientX,
          y: clientY,
        };

        // We need to prevent the default event in order to block native scrolling
        // Also because we are using it as part of a drag we prevent the default action
        // as a sign that we are using the event
        event.preventDefault();
        schedule.move(point);
      },
    },
    {
      eventName: 'touchend',
      fn: (event: TouchEvent) => {
        // drag had not started yet - do not prevent the default action
        if (!state.isDragging) {
          stopPendingDrag();
          return;
        }

        // already dragging - this event is directly ending a drag
        event.preventDefault();
        stopDragging(callbacks.onDrop);
      },
    },
    {
      eventName: 'touchcancel',
      fn: (event: TouchEvent) => {
        // drag had not started yet - do not prevent the default action
        if (!state.isDragging) {
          stopPendingDrag();
          return;
        }

        // already dragging - this event is directly ending a drag
        event.preventDefault();
        stopDragging(callbacks.onCancel);
      },
    },
    // another touch start should not happen without a
    // touchend or touchcancel. However, just being super safe
    {
      eventName: 'touchstart',
      fn: cancel,
    },
    // If the orientation of the device changes - kill the drag
    // https://davidwalsh.name/orientation-change
    {
      eventName: 'orientationchange',
      fn: cancel,
    },
    // some devices fire resize if the orientation changes
    {
      eventName: 'resize',
      fn: cancel,
    },
    // ## Passive: true
    // For scroll events we are okay with eventual consistency.
    // Passive scroll listeners is the default behavior for mobile
    // but we are being really clear here
    // ## Capture: false
    // Scroll events on elements do not bubble, but they go through the capture phase
    // https://twitter.com/alexandereardon/status/985994224867819520
    // Using capture: false here as we want to avoid intercepting droppable scroll requests
    {
      eventName: 'scroll',
      options: { passive: true, capture: false },
      fn: () => {
        // stop a pending drag
        if (state.pending) {
          stopPendingDrag();
          return;
        }
        schedule.windowScrollMove();
      },
    },
    // Long press can bring up a context menu
    // need to opt out of this behavior
    {
      eventName: 'contextmenu',
      fn: (event: Event) => {
        // always opting out of context menu events
        event.preventDefault();
      },
    },
    // On some devices it is possible to have a touch interface with a keyboard.
    // On any keyboard event we cancel a touch drag
    {
      eventName: 'keydown',
      fn: (event: KeyboardEvent) => {
        if (!state.isDragging) {
          cancel();
          return;
        }

        // direct cancel: we are preventing the default action
        // indirect cancel: we are not preventing the default action

        // escape is a direct cancel
        if (event.keyCode === keyCodes.escape) {
          event.preventDefault();
        }
        cancel();
      },
    },
    // Need to opt out of dragging if the user is a force press
    // Only for webkit which has decided to introduce its own custom way of doing things
    // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
    {
      eventName: 'touchforcechange',
      fn: (event: TouchEvent) => {
        // A force push action will no longer fire after a touchmove
        if (state.hasMoved) {
          // This is being super safe. While this situation should not occur we
          // are still expressing that we want to opt out of force pressing
          event.preventDefault();
          return;
        }

        // A drag could be pending or has already started but no movement has occurred

        const touch: TouchWithForce = (event.touches[0]: any);

        if (touch.force >= forcePressThreshold) {
          // this is an indirect cancel so we do not preventDefault
          // we also want to allow the force press to occur
          cancel();
        }
      },
    },
    // Cancel on page visibility change
    {
      eventName: supportedPageVisibilityEventName,
      fn: cancel,
    },
  ];

  const bindWindowEvents = () => {
    bindEvents(getWindow(), windowBindings, { capture: true });
  };

  const unbindWindowEvents = () => {
    unbindEvents(getWindow(), windowBindings, { capture: true });
  };

  // entry point
  const onTouchStart = (event: TouchEvent) => {
    if (touchStartMarshal.isHandled()) {
      return;
    }

    invariant(
      !isCapturing(),
      'Should not be able to perform a touch start while a drag or pending drag is occurring',
    );

    // We do not need to prevent the event on a dropping draggable as
    // the touchstart event will not fire due to pointer-events: none
    // https://codesandbox.io/s/oxo0o775rz
    if (!canStartCapturing(event)) {
      return;
    }

    // We need to stop parents from responding to this event - which may cause a double lift
    // We also need to NOT call event.preventDefault() so as to maintain as much standard
    // browser interactions as possible.
    // This includes navigation on anchors which we want to preserve
    touchStartMarshal.handle();

    // A webkit only hack to prevent touch move events
    webkitHack.preventTouchMove();
    startPendingDrag(event);
  };

  const sensor: TouchSensor = {
    onTouchStart,
    kill,
    isCapturing,
    isDragging,
    unmount,
  };

  return sensor;
};
