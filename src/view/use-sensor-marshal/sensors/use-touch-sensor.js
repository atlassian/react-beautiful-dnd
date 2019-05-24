// @flow
import invariant from 'tiny-invariant';
import { useRef } from 'react';
import { useCallback, useMemo } from 'use-memo-one';
import type { Position } from 'css-box-model';
import type { PreDragActions, DragActions } from '../../../types';
import type {
  EventBinding,
  EventOptions,
} from '../../event-bindings/event-types';
import bindEvents from '../../event-bindings/bind-events';
import * as keyCodes from '../../key-codes';
import supportedPageVisibilityEventName from './util/supported-page-visibility-event-name';
import { noop } from '../../../empty';
import useLayoutEffect from '../../use-isomorphic-layout-effect';

type TouchWithForce = Touch & {
  force: number,
};

type Idle = {|
  type: 'IDLE',
|};

type Pending = {|
  type: 'PENDING',
  point: Position,
  actions: PreDragActions,
  longPressTimerId: TimeoutID,
|};

type Dragging = {|
  type: 'DRAGGING',
  actions: DragActions,
  hasMoved: boolean,
|};

type Phase = Idle | Pending | Dragging;

const idle: Idle = { type: 'IDLE' };
export const timeForLongPress: number = 150;
export const forcePressThreshold: number = 0.15;

type GetBindingArgs = {|
  cancel: () => void,
  completed: () => void,
  getPhase: () => Phase,
|};

function getWindowBindings({
  cancel,
  getPhase,
}: GetBindingArgs): EventBinding[] {
  return [
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
        if (getPhase().type !== 'DRAGGING') {
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
    // Cancel on page visibility change
    {
      eventName: supportedPageVisibilityEventName,
      fn: cancel,
    },
  ];
}

// All of the touch events get applied to the initial target of the touch interaction
// This plays well with the target being unmounted during a drag
function getTargetBindings({
  cancel,
  completed,
  getPhase,
}: GetBindingArgs): EventBinding[] {
  return [
    {
      eventName: 'touchmove',
      // Opting out of passive touchmove (default) so as to prevent scrolling while moving
      // Not worried about performance as effect of move is throttled in requestAnimationFrame
      // Using `capture: false` due to a recent horrible firefox bug: https://twitter.com/alexandereardon/status/1125904207184187393
      options: { capture: false },
      fn: (event: TouchEvent) => {
        const phase: Phase = getPhase();
        // Drag has not yet started and we are waiting for a long press.
        if (phase.type !== 'DRAGGING') {
          cancel();
          return;
        }

        // At this point we are dragging
        phase.hasMoved = true;

        const { clientX, clientY } = event.touches[0];

        const point: Position = {
          x: clientX,
          y: clientY,
        };

        // We need to prevent the default event in order to block native scrolling
        // Also because we are using it as part of a drag we prevent the default action
        // as a sign that we are using the event
        event.preventDefault();
        phase.actions.move(point);
      },
    },
    {
      eventName: 'touchend',
      fn: (event: TouchEvent) => {
        const phase: Phase = getPhase();
        // drag had not started yet - do not prevent the default action
        if (phase.type !== 'DRAGGING') {
          cancel();
          return;
        }

        // ending the drag
        event.preventDefault();
        phase.actions.drop({ shouldBlockNextClick: true });
        completed();
      },
    },
    {
      eventName: 'touchcancel',
      fn: (event: TouchEvent) => {
        // drag had not started yet - do not prevent the default action
        if (getPhase().type !== 'DRAGGING') {
          cancel();
          return;
        }

        // already dragging - this event is directly ending a drag
        event.preventDefault();
        cancel();
      },
    },
    // Need to opt out of dragging if the user is a force press
    // Only for webkit which has decided to introduce its own custom way of doing things
    // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
    {
      eventName: 'touchforcechange',
      fn: (event: TouchEvent) => {
        const phase: Phase = getPhase();

        // needed to use phase.actions
        invariant(phase.type !== 'IDLE');

        // Opting out of respecting force press interactions
        if (!phase.actions.shouldRespectForcePress()) {
          event.preventDefault();
          return;
        }

        // A force push action will no longer fire after a touchmove
        // This is being super safe. While this situation should not occur we
        // are still expressing that we want to opt out of force pressing
        if (phase.type === 'DRAGGING' && phase.hasMoved) {
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
    // Not adding a cancel on touchstart as this handler will pick up the initial touchstart event
  ];
}

export default function useMouseSensor(
  tryStartCapturing: (event: Event, abort: () => void) => ?PreDragActions,
) {
  const phaseRef = useRef<Phase>(idle);
  const unbindEventsRef = useRef<() => void>(noop);

  const getPhase = useCallback(function getPhase(): Phase {
    return phaseRef.current;
  }, []);

  const setPhase = useCallback(function setPhase(phase: Phase) {
    phaseRef.current = phase;
  }, []);

  const startCaptureBinding: EventBinding = useMemo(
    () => ({
      eventName: 'touchstart',
      fn: function onTouchStart(event: TouchEvent) {
        // Event already used by something else
        if (event.defaultPrevented) {
          return;
        }

        // We need to NOT call event.preventDefault() so as to maintain as much standard
        // browser interactions as possible.
        // This includes navigation on anchors which we want to preserve

        // eslint-disable-next-line no-use-before-define
        const actions: ?PreDragActions = tryStartCapturing(event, stop);

        // could not start a drag
        if (!actions) {
          return;
        }

        console.log('touches', event.touches);
        const touch: Touch = event.touches[0];
        const { clientX, clientY } = touch;
        const point: Position = {
          x: clientX,
          y: clientY,
        };
        const target: EventTarget = event.target;
        invariant(
          target instanceof HTMLElement,
          'Expected touch target to be an element',
        );

        // unbind this event handler
        unbindEventsRef.current();

        // eslint-disable-next-line no-use-before-define
        startPendingDrag(actions, point, target);
      },
    }),
    // not including stop or startPendingDrag as it is not defined initially
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tryStartCapturing],
  );

  const listenForCapture = useCallback(
    function listenForCapture() {
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
    const current: Phase = phaseRef.current;
    if (current.type === 'IDLE') {
      return;
    }

    // aborting any pending drag
    if (current.type === 'PENDING') {
      clearTimeout(current.longPressTimerId);
    }

    console.log('STOPPing');
    setPhase(idle);
    unbindEventsRef.current();

    console.log('listen for capture');
    listenForCapture();
  }, [listenForCapture, setPhase]);

  const cancel = useCallback(() => {
    const phase: Phase = phaseRef.current;
    stop();
    if (phase.type === 'DRAGGING') {
      phase.actions.cancel({ shouldBlockNextClick: true });
    }
    if (phase.type === 'PENDING') {
      phase.actions.abort();
    }
  }, [stop]);

  const bindCapturingEvents = useCallback(
    function bindCapturingEvents(target: HTMLElement) {
      const options: EventOptions = { capture: true, passive: false };
      const args: GetBindingArgs = {
        cancel,
        completed: stop,
        getPhase,
      };

      // When removing a drag handle, such as moving into a portal or clone,
      // touch events stop being published to the window.
      // Even though the handle is removed, if you attach events to it they will
      // continue to fire for the interaction. Strange, but hey - that's the web
      // https://gist.github.com/parris/dda613e3ae78f14eb2dc9fa0f4bfce3d
      // https://stackoverflow.com/questions/33298828/touch-move-event-dont-fire-after-touch-start-target-is-removed
      const unbindTarget = bindEvents(target, getTargetBindings(args), options);
      const unbindWindow = bindEvents(window, getWindowBindings(args), options);

      unbindEventsRef.current = function unbind() {
        unbindTarget();
        unbindWindow();
      };
    },
    [cancel, getPhase, stop],
  );

  const startDragging = useCallback(
    function startDragging() {
      const phase: Phase = getPhase();
      invariant(
        phase.type === 'PENDING',
        `Cannot start dragging from phase ${phase.type}`,
      );

      const actions: DragActions = phase.actions.lift({
        clientSelection: phase.point,
        mode: 'FLUID',
      });

      setPhase({
        type: 'DRAGGING',
        actions,
        hasMoved: false,
      });
    },
    [getPhase, setPhase],
  );

  const startPendingDrag = useCallback(
    function startPendingDrag(
      actions: PreDragActions,
      point: Position,
      target: HTMLElement,
    ) {
      invariant(
        getPhase().type === 'IDLE',
        'Expected to move from IDLE to PENDING drag',
      );

      const longPressTimerId: TimeoutID = setTimeout(
        startDragging,
        timeForLongPress,
      );

      setPhase({
        type: 'PENDING',
        point,
        actions,
        longPressTimerId,
      });

      bindCapturingEvents(target);
    },
    [bindCapturingEvents, getPhase, setPhase, startDragging],
  );

  useLayoutEffect(() => {
    listenForCapture();

    return function unmount() {
      // remove any existing listeners
      unbindEventsRef.current();

      // need to kill any pending drag start timer
      const phase: Phase = getPhase();
      if (phase.type === 'PENDING') {
        clearTimeout(phase.longPressTimerId);
        setPhase(idle);
      }
    };
  }, [getPhase, listenForCapture, setPhase]);
}
