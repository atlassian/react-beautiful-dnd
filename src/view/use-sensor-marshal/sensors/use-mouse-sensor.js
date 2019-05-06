// @flow
import invariant from 'tiny-invariant';
import { useEffect, useRef } from 'react';
import { useCallback, useMemo } from 'use-memo-one';
import type { Position } from 'css-box-model';
import type { MovementCallbacks } from '../sensor-types';
import type {
  EventBinding,
  EventOptions,
} from '../../event-bindings/event-types';
import bindEvents from '../../event-bindings/bind-events';
import isSloppyClickThresholdExceeded from './util/is-sloppy-click-threshold-exceeded';
import * as keyCodes from '../../key-codes';
import preventStandardKeyEvents from './util/prevent-standard-key-events';
import supportedPageVisibilityEventName from './util/supported-page-visibility-event-name';
import { warning } from '../../../dev-warning';

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const primaryButton: number = 0;
function noop() {}

type MouseForceChangedEvent = MouseEvent & {
  webkitForce?: number,
};

type Idle = {|
  type: 'IDLE',
|};

type Pending = {|
  type: 'PENDING',
  point: Position,
  callbacks: MovementCallbacks,
|};

type Dragging = {|
  type: 'DRAGGING',
  callbacks: MovementCallbacks,
|};

type Phase = Idle | Pending | Dragging;

const idle: Idle = { type: 'IDLE' };

type GetCaptureArgs = {|
  cancel: () => void,
  completed: () => void,
  getPhase: () => Phase,
  setPhase: (phase: Phase) => void,
|};

function getCaptureBindings({
  cancel,
  completed,
  getPhase,
  setPhase,
}: GetCaptureArgs): EventBinding[] {
  return [
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

        const phase: Phase = getPhase();

        // Already dragging
        if (phase.type === 'DRAGGING') {
          // preventing default as we are using this event
          event.preventDefault();
          phase.callbacks.move(point);
          return;
        }

        // There should be a pending drag at this point
        invariant(phase.type === 'PENDING', 'Cannot be IDLE');
        const pending: Position = phase.point;

        // threshold not yet exceeded
        if (!isSloppyClickThresholdExceeded(pending, point)) {
          return;
        }

        // preventing default as we are using this event
        event.preventDefault();

        setPhase({
          type: 'DRAGGING',
          callbacks: phase.callbacks,
        });

        phase.callbacks.lift({
          clientSelection: pending,
          mode: 'FLUID',
        });
      },
    },
    {
      eventName: 'mouseup',
      fn: (event: MouseEvent) => {
        const phase: Phase = getPhase();

        if (phase.type !== 'DRAGGING') {
          cancel();
          return;
        }

        // preventing default as we are using this event
        event.preventDefault();
        phase.callbacks.drop({ shouldBlockNextClick: true });
        completed();
      },
    },
    {
      eventName: 'mousedown',
      fn: (event: MouseEvent) => {
        // this can happen during a drag when the user clicks a button
        // other than the primary mouse button
        if (getPhase().type === 'DRAGGING') {
          event.preventDefault();
        }

        cancel();
      },
    },
    {
      eventName: 'keydown',
      fn: (event: KeyboardEvent) => {
        const phase: Phase = getPhase();
        // Abort if any keystrokes while a drag is pending
        if (phase.type === 'PENDING') {
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
      // kill a pending drag if there is a window scroll
      options: { passive: true, capture: false },
      fn: () => {
        if (getPhase().type === 'PENDING') {
          cancel();
        }
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

        const phase: Phase = getPhase();
        invariant(phase.type !== 'IDLE', 'Unexpected phase');

        // might not be respecting force press
        if (!phase.callbacks.shouldRespectForcePress()) {
          event.preventDefault();
          return;
        }

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
}

export default function useMouseSensor(
  tryStartCapturing: (event: Event) => ?MovementCallbacks,
) {
  const phaseRef = useRef<Phase>(idle);
  const unbindEventsRef = useRef<() => void>(noop);

  const startCaptureBinding: EventBinding = useMemo(
    () => ({
      eventName: 'mousedown',
      fn: function onMouseDown(event: MouseEvent) {
        // only starting a drag if dragging with the primary mouse button
        if (event.button !== primaryButton) {
          return;
        }

        // Do not start a drag if any modifier key is pressed
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
          return;
        }

        const callbacks: ?MovementCallbacks = tryStartCapturing(event);

        if (!callbacks) {
          console.log('cannot start a capture');
          return;
        }

        event.preventDefault();

        const point: Position = {
          x: event.clientX,
          y: event.clientY,
        };

        // unbind this listener
        unbindEventsRef.current();
        // using this function before it is defined as their is a circular usage pattern
        // eslint-disable-next-line no-use-before-define
        startPendingDrag(callbacks, point);
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

  const stop = useCallback(() => {
    console.log('trying to stop');
    const current: Phase = phaseRef.current;
    if (current.type === 'IDLE') {
      return;
    }

    phaseRef.current = idle;
    unbindEventsRef.current();

    listenForCapture();
  }, [listenForCapture]);

  const cancel = useCallback(() => {
    const phase: Phase = phaseRef.current;
    stop();
    if (phase.type === 'DRAGGING') {
      phase.callbacks.cancel({ shouldBlockNextClick: true });
    }
    if (phase.type === 'PENDING') {
      phase.callbacks.abort();
    }
  }, [stop]);

  const bindCapturingEvents = useCallback(
    function bindCapturingEvents() {
      const options = { capture: true, passive: false };
      const bindings: EventBinding[] = getCaptureBindings({
        cancel,
        completed: stop,
        getPhase: () => phaseRef.current,
        setPhase: (phase: Phase) => {
          phaseRef.current = phase;
        },
      });

      unbindEventsRef.current = bindEvents(window, bindings, options);
    },
    [cancel, stop],
  );

  const startPendingDrag = useCallback(
    function startPendingDrag(callbacks: MovementCallbacks, point: Position) {
      invariant(
        phaseRef.current.type === 'IDLE',
        'Expected to move from IDLE to PENDING drag',
      );
      phaseRef.current = {
        type: 'PENDING',
        point,
        callbacks,
      };
      bindCapturingEvents();
    },
    [bindCapturingEvents],
  );

  useEffect(() => {
    listenForCapture();

    // kill any pending window events when unmounting
    return () => {
      unbindEventsRef.current();
    };
  }, [listenForCapture]);
}
