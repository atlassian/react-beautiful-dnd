// @flow
/* eslint-disable no-use-before-define */
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import createScheduler from '../util/create-scheduler';
import isSloppyClickThresholdExceeded from '../util/is-sloppy-click-threshold-exceeded';
import * as keyCodes from '../../key-codes';
import preventStandardKeyEvents from '../util/prevent-standard-key-events';
import createPostDragEventPreventer, {
  type EventPreventer,
} from '../util/create-post-drag-event-preventer';
import { bindEvents, unbindEvents } from '../util/bind-events';
import createEventMarshal, {
  type EventMarshal,
} from '../util/create-event-marshal';
import supportedPageVisibilityEventName from '../util/supported-page-visibility-event-name';
import type { EventBinding } from '../util/event-types';
import type { MouseSensor, CreateSensorArgs } from './sensor-types';

// Custom event format for force press inputs
type MouseForceChangedEvent = MouseEvent & {
  webkitForce?: number,
};

type State = {|
  isDragging: boolean,
  pending: ?Position,
|};

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const primaryButton: number = 0;
const noop = () => {};

// shared management of mousedown without needing to call preventDefault()
const mouseDownMarshal: EventMarshal = createEventMarshal();

export default ({
  callbacks,
  getWindow,
  canStartCapturing,
}: CreateSensorArgs): MouseSensor => {
  let state: State = {
    isDragging: false,
    pending: null,
  };
  const setState = (newState: State): void => {
    state = newState;
  };
  const isDragging = (): boolean => state.isDragging;
  const isCapturing = (): boolean => Boolean(state.pending || state.isDragging);
  const schedule = createScheduler(callbacks);
  const postDragEventPreventer: EventPreventer = createPostDragEventPreventer(
    getWindow,
  );

  const startDragging = (fn?: Function = noop) => {
    setState({
      pending: null,
      isDragging: true,
    });
    fn();
  };
  const stopDragging = (
    fn?: Function = noop,
    shouldBlockClick?: boolean = true,
  ) => {
    schedule.cancel();
    unbindWindowEvents();
    mouseDownMarshal.reset();
    if (shouldBlockClick) {
      postDragEventPreventer.preventNext();
    }
    setState({
      isDragging: false,
      pending: null,
    });
    fn();
  };
  const startPendingDrag = (point: Position) => {
    setState({ pending: point, isDragging: false });
    bindWindowEvents();
  };
  const stopPendingDrag = () => {
    stopDragging(noop, false);
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

  const unmount = (): void => {
    kill();
    postDragEventPreventer.abort();
  };

  const cancel = () => {
    kill(callbacks.onCancel);
  };

  const windowBindings: EventBinding[] = [
    {
      eventName: 'mousemove',
      fn: (event: MouseEvent) => {
        const { button, clientX, clientY } = event;
        if (button !== primaryButton) {
          return;
        }

        const point: Position = {
          x: clientX,
          y: clientY,
        };

        // Already dragging
        if (state.isDragging) {
          // preventing default as we are using this event
          event.preventDefault();
          schedule.move(point);
          return;
        }

        // drag should be pending
        if (!state.pending) {
          kill();
          invariant(false, 'Expected there to be a pending drag');
        }

        // threshold not yet exceeded
        if (!isSloppyClickThresholdExceeded(state.pending, point)) {
          return;
        }

        // preventing default as we are using this event
        event.preventDefault();
        startDragging(() =>
          callbacks.onLift({
            clientSelection: point,
            autoScrollMode: 'FLUID',
          }),
        );
      },
    },
    {
      eventName: 'mouseup',
      fn: (event: MouseEvent) => {
        if (state.pending) {
          stopPendingDrag();
          return;
        }

        // preventing default as we are using this event
        event.preventDefault();
        stopDragging(callbacks.onDrop);
      },
    },
    {
      eventName: 'mousedown',
      fn: (event: MouseEvent) => {
        // this can happen during a drag when the user clicks a button
        // other than the primary mouse button
        if (state.isDragging) {
          event.preventDefault();
        }

        stopDragging(callbacks.onCancel);
      },
    },
    {
      eventName: 'keydown',
      fn: (event: KeyboardEvent) => {
        // firing a keyboard event before the drag has started
        // treat this as an indirect cancel
        if (!state.isDragging) {
          cancel();
          return;
        }

        // cancelling a drag
        if (event.keyCode === keyCodes.escape) {
          event.preventDefault();
          cancel();
          return;
        }

        preventStandardKeyEvents(event);
      },
    },
    {
      eventName: 'resize',
      fn: cancel,
    },
    {
      eventName: 'scroll',
      // ## Passive: true
      // Eventual consistency is fine because we use position: fixed on the item
      // ## Capture: false
      // Scroll events on elements do not bubble, but they go through the capture phase
      // https://twitter.com/alexandereardon/status/985994224867819520
      // Using capture: false here as we want to avoid intercepting droppable scroll requests
      options: { passive: true, capture: false },
      fn: () => {
        // stop a pending drag
        if (state.pending) {
          stopPendingDrag();
          return;
        }
        // callbacks.onWindowScroll();
        schedule.windowScrollMove();
      },
    },
    // Need to opt out of dragging if the user is a force press
    // Only for safari which has decided to introduce its own custom way of doing things
    // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
    {
      eventName: 'webkitmouseforcechanged',
      fn: (event: MouseForceChangedEvent) => {
        if (
          event.webkitForce == null ||
          (MouseEvent: any).WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN == null
        ) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              'handling a mouse force changed event when it is not supported',
            );
          }
          return;
        }

        const forcePressThreshold: number = (MouseEvent: any)
          .WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN;
        const isForcePressing: boolean =
          event.webkitForce >= forcePressThreshold;

        if (isForcePressing) {
          // it is considered a indirect cancel so we do not
          // prevent default in any situation.
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
    const win: HTMLElement = getWindow();
    bindEvents(win, windowBindings, { capture: true });
  };

  const unbindWindowEvents = () => {
    const win: HTMLElement = getWindow();
    unbindEvents(win, windowBindings, { capture: true });
  };

  const onMouseDown = (event: MouseEvent): void => {
    if (mouseDownMarshal.isHandled()) {
      return;
    }

    invariant(
      !isCapturing(),
      'Should not be able to perform a mouse down while a drag or pending drag is occurring',
    );

    // We do not need to prevent the event on a dropping draggable as
    // the mouse down event will not fire due to pointer-events: none
    // https://codesandbox.io/s/oxo0o775rz
    if (!canStartCapturing(event)) {
      return;
    }

    // only starting a drag if dragging with the primary mouse button
    if (event.button !== primaryButton) {
      return;
    }

    // Do not start a drag if any modifier key is pressed
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    // Registering that this event has been handled.
    // This is to prevent parent draggables using this event
    // to start also.
    // Ideally we would not use preventDefault() as we are not sure
    // if this mouse down is part of a drag interaction
    // Unfortunately we do to prevent the element obtaining focus (see below).
    mouseDownMarshal.handle();

    // Unfortunately we do need to prevent the drag handle from getting focus on mousedown.
    // This goes against our policy on not blocking events before a drag has started.
    // See [How we use dom events](/docs/guides/how-we-use-dom-events.md).
    event.preventDefault();

    const point: Position = {
      x: event.clientX,
      y: event.clientY,
    };

    startPendingDrag(point);
  };

  const sensor: MouseSensor = {
    onMouseDown,
    kill,
    isCapturing,
    isDragging,
    unmount,
  };

  return sensor;
};
