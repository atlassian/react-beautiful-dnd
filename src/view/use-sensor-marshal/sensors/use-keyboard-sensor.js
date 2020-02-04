// @flow
import { useRef } from 'react';
import { useMemo, useCallback } from 'use-memo-one';
import { invariant } from '../../../invariant';
import type {
  SensorAPI,
  PreDragActions,
  SnapDragActions,
  DraggableId,
} from '../../../types';
import type {
  EventBinding,
  EventOptions,
} from '../../event-bindings/event-types';
import * as keyCodes from '../../key-codes';
import bindEvents from '../../event-bindings/bind-events';
import preventStandardKeyEvents from './util/prevent-standard-key-events';
import supportedPageVisibilityEventName from './util/supported-page-visibility-event-name';
import useLayoutEffect from '../../use-isomorphic-layout-effect';

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
  actions: SnapDragActions,
  stop: () => void,
): EventBinding[] {
  function cancel() {
    stop();
    actions.cancel();
  }

  function drop() {
    stop();
    actions.drop();
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
          actions.moveDown();
          return;
        }

        if (event.keyCode === keyCodes.arrowUp) {
          event.preventDefault();
          actions.moveUp();
          return;
        }

        if (event.keyCode === keyCodes.arrowRight) {
          event.preventDefault();
          actions.moveRight();
          return;
        }

        if (event.keyCode === keyCodes.arrowLeft) {
          event.preventDefault();
          actions.moveLeft();
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

export default function useKeyboardSensor(api: SensorAPI) {
  const unbindEventsRef = useRef<() => void>(noop);

  const startCaptureBinding: EventBinding = useMemo(
    () => ({
      eventName: 'keydown',
      fn: function onKeyDown(event: KeyboardEvent) {
        // Event already used
        if (event.defaultPrevented) {
          return;
        }

        // Need to start drag with a spacebar press
        if (event.keyCode !== keyCodes.space) {
          return;
        }

        const draggableId: ?DraggableId = api.findClosestDraggableId(event);

        if (!draggableId) {
          return;
        }

        const preDrag: ?PreDragActions = api.tryGetLock(
          draggableId,
          // abort function not defined yet
          // eslint-disable-next-line no-use-before-define
          stop,
          { sourceEvent: event },
        );

        // Cannot start capturing at this time
        if (!preDrag) {
          return;
        }

        // we are consuming the event
        event.preventDefault();
        let isCapturing: boolean = true;

        // There is no pending period for a keyboard drag
        // We can lift immediately
        const actions: SnapDragActions = preDrag.snapLift();

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
          getDraggingBindings(actions, stop),
          { capture: true, passive: false },
        );
      },
    }),
    // not including startPendingDrag as it is not defined initially
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api],
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

  useLayoutEffect(
    function mount() {
      listenForCapture();

      // kill any pending window events when unmounting
      return function unmount() {
        unbindEventsRef.current();
      };
    },
    [listenForCapture],
  );
}
