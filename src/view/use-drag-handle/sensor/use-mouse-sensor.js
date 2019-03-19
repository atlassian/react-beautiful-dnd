// @flow
import type { Position } from 'css-box-model';
import { useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import invariant from 'tiny-invariant';
import type { EventBinding } from '../util/event-types';
import createEventMarshal, {
  type EventMarshal,
} from '../util/create-event-marshal';
import { bindEvents, unbindEvents } from '../util/bind-events';
import createScheduler from '../util/create-scheduler';
import { warning } from '../../../dev-warning';
import * as keyCodes from '../../key-codes';
import supportedPageVisibilityEventName from '../util/supported-page-visibility-event-name';
import createPostDragEventPreventer, {
  type EventPreventer,
} from '../util/create-post-drag-event-preventer';
import isSloppyClickThresholdExceeded from '../util/is-sloppy-click-threshold-exceeded';
import preventStandardKeyEvents from '../util/prevent-standard-key-events';
import type { Callbacks } from '../drag-handle-types';

export type Args = {|
  callbacks: Callbacks,
  getDraggableRef: () => ?HTMLElement,
  getWindow: () => HTMLElement,
  canStartCapturing: (event: Event) => boolean,
  getShouldRespectForceTouch: () => boolean,
  shouldAbortCapture: boolean,
|};
export type Result = {
  onMouseDown: (event: MouseEvent) => void,
  isCapturing: boolean,
};

// Custom event format for force press inputs
type MouseForceChangedEvent = MouseEvent & {
  webkitForce?: number,
};

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const primaryButton: number = 0;
const noop = () => {};

// shared management of mousedown without needing to call preventDefault()
const mouseDownMarshal: EventMarshal = createEventMarshal();

export default function useMouseSensor(args: Args): Result {
  const { canStartCapturing, getWindow, callbacks, shouldAbortCapture } = args;
  const pendingRef = useRef<?Position>(null);
  const isDraggingRef = useRef<boolean>(false);
  const unbindWindowEventsRef = useRef<() => void>(noop);
  const getIsCapturing = useCallback(
    () => Boolean(pendingRef.current || isDraggingRef.current),
    [],
  );
  const reset = useCallback(() => {
    pendingRef.current = null;
    isDraggingRef.current = false;
  }, []);

  const schedule = useMemo(() => {
    invariant(
      !getIsCapturing(),
      'Should not recreate scheduler while capturing',
    );
    return createScheduler(callbacks);
  }, [callbacks, getIsCapturing]);

  const postDragEventPreventer: EventPreventer = useMemo(
    () => createPostDragEventPreventer(getWindow),
    [getWindow],
  );

  const stop = useCallback(
    (shouldBlockClick: ?boolean = true) => {
      if (!getIsCapturing()) {
        return;
      }

      schedule.cancel();

      unbindWindowEventsRef.current();
      mouseDownMarshal.reset();
      if (shouldBlockClick) {
        postDragEventPreventer.preventNext();
      }
      reset();
    },
    [getIsCapturing, postDragEventPreventer, reset, schedule],
  );

  // instructed to stop capturing
  if (shouldAbortCapture && getIsCapturing()) {
    stop();
  }

  const cancel = useCallback(() => {
    const wasDragging: boolean = isDraggingRef.current;
    stop();

    if (wasDragging) {
      callbacks.onCancel();
    }
  }, [callbacks, stop]);

  const startDragging = useCallback(() => {
    invariant(!isDraggingRef.current, 'Cannot start a drag while dragging');
    const pending: ?Position = pendingRef.current;
    invariant(pending, 'Cannot start a drag without a pending drag');

    pendingRef.current = null;
    isDraggingRef.current = true;

    callbacks.onLift({
      clientSelection: pending,
      movementMode: 'FLUID',
    });
  }, [callbacks]);

  const windowBindings: EventBinding[] = useMemo(() => {
    invariant(
      !getIsCapturing(),
      'Should not recreate window bindings while capturing',
    );

    const bindings: EventBinding[] = [
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
          if (isDraggingRef.current) {
            // preventing default as we are using this event
            event.preventDefault();
            schedule.move(point);
            return;
          }

          // There should be a pending drag at this point
          const pending: ?Position = pendingRef.current;

          if (!pending) {
            // this should be an impossible state
            // we cannot use kill directly as it checks if there is a pending drag
            stop();
            invariant(
              false,
              'Expected there to be an active or pending drag when window mousemove event is received',
            );
          }

          // threshold not yet exceeded
          if (!isSloppyClickThresholdExceeded(pending, point)) {
            return;
          }

          // preventing default as we are using this event
          event.preventDefault();
          startDragging();
        },
      },
      {
        eventName: 'mouseup',
        fn: (event: MouseEvent) => {
          const wasDragging: boolean = isDraggingRef.current;
          stop();

          if (wasDragging) {
            // preventing default as we are using this event
            event.preventDefault();
            callbacks.onDrop();
          }
        },
      },
      {
        eventName: 'mousedown',
        fn: (event: MouseEvent) => {
          // this can happen during a drag when the user clicks a button
          // other than the primary mouse button
          if (isDraggingRef.current) {
            event.preventDefault();
          }

          cancel();
        },
      },
      {
        eventName: 'keydown',
        fn: (event: KeyboardEvent) => {
          // Abort if any keystrokes while a drag is pending
          if (pendingRef.current) {
            stop();
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
        // TODO: can result in awkward drop position
        options: { passive: true, capture: false },
        fn: (event: UIEvent) => {
          // IE11 fix:
          // Scrollable events still bubble up and are caught by this handler in ie11.
          // We can ignore this event
          if (event.currentTarget !== getWindow()) {
            return;
          }

          // stop a pending drag
          if (pendingRef.current) {
            stop();
            return;
          }
          // getCallbacks().onWindowScroll();
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
            warning(
              'handling a mouse force changed event when it is not supported',
            );
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
    return bindings;
  }, [
    callbacks,
    cancel,
    getWindow,
    getIsCapturing,
    schedule,
    startDragging,
    stop,
  ]);

  const bindWindowEvents = useCallback(() => {
    const win: HTMLElement = getWindow();
    const options = { capture: true };

    // setting up our unbind before we bind
    unbindWindowEventsRef.current = () =>
      unbindEvents(win, windowBindings, options);

    bindEvents(win, windowBindings, options);
  }, [getWindow, windowBindings]);

  const startPendingDrag = useCallback(
    (point: Position) => {
      invariant(!pendingRef.current, 'Expected there to be no pending drag');
      pendingRef.current = point;
      bindWindowEvents();
    },
    [bindWindowEvents],
  );

  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      if (mouseDownMarshal.isHandled()) {
        return;
      }

      invariant(
        !getIsCapturing(),
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
    },
    [canStartCapturing, getIsCapturing, startPendingDrag],
  );

  // When unmounting - cancel
  useLayoutEffect(() => {
    return () => cancel();
  }, [cancel]);

  return {
    onMouseDown,
    isCapturing: getIsCapturing(),
  };
}
