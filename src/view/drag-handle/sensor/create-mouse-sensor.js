// @flow
/* eslint-disable no-use-before-define */
import stopEvent from '../util/stop-event';
import createScheduler from '../util/create-scheduler';
import isSloppyClickThresholdExceeded from '../util/is-sloppy-click-threshold-exceeded';
import getWindowFromRef from '../../get-window-from-ref';
import * as keyCodes from '../../key-codes';
import blockStandardKeyEvents from '../util/block-standard-key-events';
import type {
  Position,
} from '../../../types';
import type { MouseSensor, CreateSensorArgs } from './sensor-types';

// Custom event format for force press inputs
type MouseForceChangedEvent = MouseEvent & {
  webkitForce?: number,
}

type State = {|
  isDragging: boolean,
  pending: ?Position,
|}

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const primaryButton = 0;
const noop = () => { };

export default ({
  callbacks,
  getDraggableRef,
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

  const startDragging = (fn?: Function = noop) => {
    setState({
      pending: null,
      isDragging: true,
    });
    fn();
  };
  const stopDragging = (fn?: Function = noop, shouldBlockClick?: boolean = true) => {
    schedule.cancel();
    unbindWindowEvents();
    if (shouldBlockClick) {
      bindPostDragOnWindowClick();
    }
    setState({
      isDragging: false,
      pending: null,
    });
    fn();
  };
  const startPendingDrag = (point: Position) => {
    unbindPostDragOnWindowClick();
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
    stopDragging(fn);
  };

  const cancel = () => {
    kill(callbacks.onCancel);
  };

  const windowBindings = {
    mousemove: (event: MouseEvent) => {
      const { button, clientX, clientY } = event;
      if (button !== primaryButton) {
        return;
      }

      const point: Position = {
        x: clientX,
        y: clientY,
      };

      if (state.isDragging) {
        schedule.move(point);
        return;
      }

      if (!state.pending) {
        console.error('invalid state');
        return;
      }

      // drag is pending

      // threshold not yet exceeded
      if (!isSloppyClickThresholdExceeded(state.pending, point)) {
        return;
      }

      startDragging(() => callbacks.onLift({
        client: point,
        autoScrollMode: 'FLUID',
      }));
    },
    mouseup: () => {
      if (state.pending) {
        stopPendingDrag();
        return;
      }

      stopDragging(callbacks.onDrop);
    },
    mousedown: () => {
      // this can happen during a drag when the user clicks a button
      // other than the primary mouse button
      stopDragging(callbacks.onCancel);
    },
    keydown: (event: KeyboardEvent) => {
      // cancelling
      if (event.keyCode === keyCodes.escape) {
        stopEvent(event);
        cancel();
        return;
      }

      blockStandardKeyEvents(event);
    },
    resize: cancel,
    scroll: () => {
      // stop a pending drag
      if (state.pending) {
        stopPendingDrag();
        return;
      }
      schedule.windowScrollMove();
    },
    // Need to opt out of dragging if the user is a force press
    // Only for safari which has decided to introduce its own custom way of doing things
    // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
    webkitmouseforcechanged: (event: MouseForceChangedEvent) => {
      if (event.webkitForce == null || MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN == null) {
        console.error('handling a mouse force changed event when it is not supported');
        return;
      }

      const forcePressThreshold: number = (MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN : any);
      const isForcePressing: boolean = event.webkitForce >= forcePressThreshold;

      if (isForcePressing) {
        cancel();
      }
    },
  };

  const eventKeys = Object.keys(windowBindings);

  const bindWindowEvents = () => {
    const win: HTMLElement = getWindowFromRef(getDraggableRef());

    eventKeys.forEach((eventKey: string) => {
      if (eventKey === 'scroll') {
        // eventual consistency is fine because we use position: fixed on the item
        win.addEventListener(eventKey, windowBindings.scroll, { passive: true });
        return;
      }

      win.addEventListener(eventKey, windowBindings[eventKey]);
    });
  };

  const unbindWindowEvents = () => {
    const win: HTMLElement = getWindowFromRef(getDraggableRef());

    eventKeys.forEach((eventKey: string) =>
      win.removeEventListener(eventKey, windowBindings[eventKey])
    );
  };

  const onMouseDown = (event: MouseEvent): void => {
    if (!canStartCapturing(event)) {
      return;
    }

    if (isCapturing()) {
      console.error('should not be able to perform a mouse down while a drag or pending drag is occurring');
      cancel();
      return;
    }

    const { button, clientX, clientY } = event;

    // only starting a drag if dragging with the primary mouse button
    if (button !== primaryButton) {
      return;
    }

    // stopping the event from publishing to parents
    stopEvent(event);
    const point: Position = {
      x: clientX,
      y: clientY,
    };

    startPendingDrag(point);
  };

  const postDragWindowOnClick = (event: MouseEvent) => {
    stopEvent(event);
    // unbinding self after single use
    unbindPostDragOnWindowClick();
  };

  const bindPostDragOnWindowClick = () => {
    window.addEventListener('click', postDragWindowOnClick, { capture: true });

    // Only block clicks for the current call stack
    // after this we can allow clicks again.
    // This is to guard against the situation where a click event does
    // not fire on the element. In that case we do not want to block a click
    // on another element
    setTimeout(unbindPostDragOnWindowClick);
  };

  const unbindPostDragOnWindowClick = () => {
    window.removeEventListener('click', postDragWindowOnClick, { capture: true });
  };

  const sensor: MouseSensor = {
    onMouseDown,
    kill,
    isCapturing,
    isDragging,
  };

  return sensor;
};
