// @flow
import invariant from 'tiny-invariant';
import { useRef, useEffect } from 'react';
import { useMemo, useCallback } from 'use-memo-one';
import type { MovementCallbacks } from '../sensor-types';
import type {
  EventBinding,
  EventOptions,
} from '../../event-bindings/event-types';
import * as keyCodes from '../../key-codes';
import bindEvents from '../../event-bindings/bind-events';
import preventStandardKeyEvents from './util/prevent-standard-key-events';
import supportedPageVisibilityEventName from './util/supported-page-visibility-event-name';

function noop() {}

type KeyMap = {
  [key: number]: true,
};

const scrollJumpKeys: KeyMap = {
  [keyCodes.pageDown]: true,
  [keyCodes.pageUp]: true,
  [keyCodes.home]: true,
  [keyCodes.end]: true,
};

function getDraggingBindings(
  callbacks: MovementCallbacks,
  stop: () => void,
): EventBinding[] {
  function cancel() {
    stop();
    callbacks.cancel();
  }

  function drop() {
    stop();
    callbacks.drop();
  }

  return [
    {
      eventName: 'keydown',
      fn: (event: KeyboardEvent) => {
        if (event.keyCode === keyCodes.escape) {
          event.preventDefault();
          cancel();
          return;
        }

        // Dropping
        if (event.keyCode === keyCodes.space) {
          // need to stop parent Draggable's thinking this is a lift
          event.preventDefault();
          drop();
          return;
        }

        // Movement

        if (event.keyCode === keyCodes.arrowDown) {
          event.preventDefault();
          callbacks.moveDown();
          return;
        }

        if (event.keyCode === keyCodes.arrowUp) {
          event.preventDefault();
          callbacks.moveUp();
          return;
        }

        if (event.keyCode === keyCodes.arrowRight) {
          event.preventDefault();
          callbacks.moveRight();
          return;
        }

        if (event.keyCode === keyCodes.arrowLeft) {
          event.preventDefault();
          callbacks.moveLeft();
          return;
        }

        // preventing scroll jumping at this time
        if (scrollJumpKeys[event.keyCode]) {
          event.preventDefault();
          return;
        }

        preventStandardKeyEvents(event);
      },
    },
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
    // Cancel on page visibility change
    {
      eventName: supportedPageVisibilityEventName,
      fn: cancel,
    },
  ];
}

export default function useKeyboardSensor(
  tryStartCapturing: (
    source: Event | Element,
    abort: () => void,
  ) => ?MovementCallbacks,
) {
  const unbindEventsRef = useRef<() => void>(noop);

  const startCaptureBinding: EventBinding = useMemo(
    () => ({
      eventName: 'keydown',
      fn: function onMouseDown(event: KeyboardEvent) {
        // We may already be lifting on a child draggable.
        // We do not need to use an EventMarshal here as
        // we always call preventDefault on the first input
        if (event.defaultPrevented) {
          return;
        }

        // Need to start drag with a spacebar press
        if (event.keyCode !== keyCodes.space) {
          return;
        }

        // abort function not defined yet
        // eslint-disable-next-line no-use-before-define
        const callbacks: ?MovementCallbacks = tryStartCapturing(event, stop);

        // Cannot start capturing at this time
        if (!callbacks) {
          return;
        }

        // we are consuming the event
        event.preventDefault();
        let isCapturing: boolean = true;

        // There is no pending period for a keyboard drag
        // We can lift immediately
        callbacks.lift({
          mode: 'SNAP',
        });

        // unbind this listener
        unbindEventsRef.current();

        // setup our function to end everything
        function stop() {
          invariant(
            isCapturing,
            'Cannot stop capturing a keyboard drag when not capturing',
          );
          isCapturing = false;

          // unbind dragging bindings
          unbindEventsRef.current();
          // start listening for capture again
          // eslint-disable-next-line no-use-before-define
          listenForCapture();
        }

        // bind dragging listeners
        unbindEventsRef.current = bindEvents(
          window,
          getDraggingBindings(callbacks, stop),
          { capture: true, passive: false },
        );
      },
    }),
    // not including startPendingDrag as it is not defined initially
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tryStartCapturing],
  );

  const listenForCapture = useCallback(
    function tryStartCapture() {
      const options: EventOptions = {
        passive: false,
        capture: true,
      };

      unbindEventsRef.current = bindEvents(
        window,
        [startCaptureBinding],
        options,
      );
    },
    [startCaptureBinding],
  );

  useEffect(() => {
    listenForCapture();

    // kill any pending window events when unmounting
    return () => {
      unbindEventsRef.current();
    };
  });
}
