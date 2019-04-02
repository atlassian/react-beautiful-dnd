// @flow
import type { Position } from 'css-box-model';
import { useRef } from 'react';
import { useMemoOne, useCallbackOne } from 'use-memo-one';
import invariant from 'tiny-invariant';
import type { EventBinding } from '../util/event-types';
import { bindEvents, unbindEvents } from '../util/bind-events';
import createScheduler from '../util/create-scheduler';
import * as keyCodes from '../../key-codes';
import supportedPageVisibilityEventName from '../util/supported-page-visibility-event-name';
import preventStandardKeyEvents from '../util/prevent-standard-key-events';
import type { Callbacks } from '../drag-handle-types';
import getBorderBoxCenterPosition from '../../get-border-box-center-position';

export type Args = {|
  callbacks: Callbacks,
  getDraggableRef: () => ?HTMLElement,
  getWindow: () => HTMLElement,
  canStartCapturing: (event: Event) => boolean,
  onCaptureStart: (abort: () => void) => void,
  onCaptureEnd: () => void,
|};
export type OnKeyDown = (event: KeyboardEvent) => void;

type KeyMap = {
  [key: number]: true,
};

const scrollJumpKeys: KeyMap = {
  [keyCodes.pageDown]: true,
  [keyCodes.pageUp]: true,
  [keyCodes.home]: true,
  [keyCodes.end]: true,
};

function noop() {}

export default function useKeyboardSensor(args: Args): OnKeyDown {
  const {
    canStartCapturing,
    getWindow,
    callbacks,
    onCaptureStart,
    onCaptureEnd,
    getDraggableRef,
  } = args;
  const isDraggingRef = useRef<boolean>(false);
  const unbindWindowEventsRef = useRef<() => void>(noop);

  const getIsDragging = useCallbackOne(() => isDraggingRef.current, []);

  const schedule = useMemoOne(() => {
    invariant(
      !getIsDragging(),
      'Should not recreate scheduler while capturing',
    );
    return createScheduler(callbacks);
  }, [callbacks, getIsDragging]);

  const stop = useCallbackOne(() => {
    if (!getIsDragging()) {
      return;
    }

    schedule.cancel();
    unbindWindowEventsRef.current();
    isDraggingRef.current = false;
    onCaptureEnd();
  }, [getIsDragging, onCaptureEnd, schedule]);

  const cancel = useCallbackOne(() => {
    const wasDragging: boolean = isDraggingRef.current;
    stop();

    if (wasDragging) {
      callbacks.onCancel();
    }
  }, [callbacks, stop]);

  const windowBindings: EventBinding[] = useMemoOne(() => {
    invariant(
      !getIsDragging(),
      'Should not recreate window bindings when dragging',
    );
    return [
      // any mouse actions kills a drag
      {
        eventName: 'mousedown',
        fn: cancel,
      },
      {
        eventName: 'mouseup',
        fn: cancel,
      },
      {
        eventName: 'click',
        fn: cancel,
      },
      {
        eventName: 'touchstart',
        fn: cancel,
      },
      // resizing the browser kills a drag
      {
        eventName: 'resize',
        fn: cancel,
      },
      // kill if the user is using the mouse wheel
      // We are not supporting wheel / trackpad scrolling with keyboard dragging
      {
        eventName: 'wheel',
        fn: cancel,
        // chrome says it is a violation for this to not be passive
        // it is fine for it to be passive as we just cancel as soon as we get
        // any event
        options: { passive: true },
      },
      // Need to respond instantly to a jump scroll request
      // Not using the scheduler
      {
        eventName: 'scroll',
        // Scroll events on elements do not bubble, but they go through the capture phase
        // https://twitter.com/alexandereardon/status/985994224867819520
        // Using capture: false here as we want to avoid intercepting droppable scroll requests
        options: { capture: false },
        fn: (event: UIEvent) => {
          // IE11 fix:
          // Scrollable events still bubble up and are caught by this handler in ie11.
          // We can ignore this event
          if (event.currentTarget !== getWindow()) {
            return;
          }

          callbacks.onWindowScroll();
        },
      },
      // Cancel on page visibility change
      {
        eventName: supportedPageVisibilityEventName,
        fn: cancel,
      },
    ];
  }, [callbacks, cancel, getIsDragging, getWindow]);

  const bindWindowEvents = useCallbackOne(() => {
    const win: HTMLElement = getWindow();
    const options = { capture: true };

    // setting up our unbind before we bind
    unbindWindowEventsRef.current = () =>
      unbindEvents(win, windowBindings, options);

    bindEvents(win, windowBindings, options);
  }, [getWindow, windowBindings]);

  const startDragging = useCallbackOne(() => {
    invariant(!isDraggingRef.current, 'Cannot start a drag while dragging');

    const ref: ?HTMLElement = getDraggableRef();
    invariant(ref, 'Cannot start a keyboard drag without a draggable ref');
    isDraggingRef.current = true;

    onCaptureStart(stop);
    bindWindowEvents();

    const center: Position = getBorderBoxCenterPosition(ref);
    callbacks.onLift({
      clientSelection: center,
      movementMode: 'SNAP',
    });
  }, [bindWindowEvents, callbacks, getDraggableRef, onCaptureStart, stop]);

  const onKeyDown: OnKeyDown = useCallbackOne(
    (event: KeyboardEvent) => {
      // not dragging yet
      if (!getIsDragging()) {
        // We may already be lifting on a child draggable.
        // We do not need to use an EventMarshal here as
        // we always call preventDefault on the first input
        if (event.defaultPrevented) {
          return;
        }

        // Cannot lift at this time
        if (!canStartCapturing(event)) {
          return;
        }

        if (event.keyCode !== keyCodes.space) {
          return;
        }

        // Calling preventDefault as we are consuming the event
        event.preventDefault();
        startDragging();
        return;
      }

      // already dragging

      // Cancelling
      if (event.keyCode === keyCodes.escape) {
        event.preventDefault();
        cancel();
        return;
      }

      // Dropping
      if (event.keyCode === keyCodes.space) {
        // need to stop parent Draggable's thinking this is a lift
        event.preventDefault();
        stop();
        callbacks.onDrop();
        return;
      }

      // Movement

      if (event.keyCode === keyCodes.arrowDown) {
        event.preventDefault();
        schedule.moveDown();
        return;
      }

      if (event.keyCode === keyCodes.arrowUp) {
        event.preventDefault();
        schedule.moveUp();
        return;
      }

      if (event.keyCode === keyCodes.arrowRight) {
        event.preventDefault();
        schedule.moveRight();
        return;
      }

      if (event.keyCode === keyCodes.arrowLeft) {
        event.preventDefault();
        schedule.moveLeft();
        return;
      }

      // preventing scroll jumping at this time
      if (scrollJumpKeys[event.keyCode]) {
        event.preventDefault();
        return;
      }

      preventStandardKeyEvents(event);
    },
    [
      callbacks,
      canStartCapturing,
      cancel,
      getIsDragging,
      schedule,
      startDragging,
      stop,
    ],
  );

  return onKeyDown;
}
