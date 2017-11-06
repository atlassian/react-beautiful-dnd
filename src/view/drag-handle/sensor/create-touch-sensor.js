// @flow
/* eslint-disable no-use-before-define */
import stopEvent from '../util/stop-event';
import createScheduler from '../util/create-scheduler';
import isSloppyClickThresholdExceeded from '../util/is-sloppy-click-threshold-exceeded';
import isForcePress from '../util/is-force-press';
import type {
  Position,
} from '../../../types';
import type {
  Callbacks,
  TouchSensor,
  Props,
  MouseForceChangedEvent,
} from '../drag-handle-types';

type State = {
  isDragging: boolean,
  startTimerId: ?number,
  pending: ?Position,
}

const noop = (): void => { };

export default (callbacks: Callbacks): TouchSensor => {
  let state: State = {
    isDragging: false,
    pending: null,
    startTimerId: null,
  };
  const setState = (newState: State): void => {
    state = newState;
  };
  const isDragging = (): boolean => state.isDragging;
  const isCapturing = (): boolean =>
    Boolean(state.pending || state.isDragging || state.startTimerId);
  const schedule = createScheduler(callbacks, isDragging);

  const startDragging = (fn?: Function = noop) => {
    setState({
      pending: null,
      isDragging: true,
      startTimerId: null,
    });
    fn();
  };
  const stopDragging = (fn?: Function = noop) => {
    unbindWindowEvents();
    setState({
      isDragging: false,
      pending: null,
      startTimerId: null,
    });
    fn();
  };

  const startPendingDrag = (point: Position) => {
    const startTimerId: number = setTimeout(
      () => startDragging(callbacks.onLift(point)),
      200
    );
    setState({
      startTimerId,
      pending: point,
      isDragging: false,
    });
    bindWindowEvents();
  };

  const stopPendingDrag = () => {
    clearTimeout(state.startTimerId);
    unbindWindowEvents();

    setState({
      startTimerId: null,
      pending: null,
      isDragging: false,
    });
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
    touchmove: (event: TouchEvent) => {
      const { clientX, clientY } = event.touches[0];

      const point: Position = {
        x: clientX,
        y: clientY,
      };

      if (state.pending) {
        if (isSloppyClickThresholdExceeded(state.pending, point)) {
          // Moved too far before the timer finished.
          // Letting the event go through without stopping it.
          stopPendingDrag();
          return;
        }
        // threshold not yet exceed and timeout not finished
        stopEvent(event);
        return;
      }

      // already dragging
      schedule.move(point);
      stopEvent(event);
    },
    touchend: (event: TouchEvent) => {
      if (state.pending) {
        stopPendingDrag();
        // Because we called event.preventDefault in touchstart all mouse events
        // including 'click' are stopped. At this point we know that the user as actually intending
        // to click (tap) so we need to manually fire a click

        // Appeasing flow with check
        if (event.target instanceof HTMLElement) {
          event.target.click();
        }

        return;
      }

      // already dragging
      stopDragging(callbacks.onDrop);
      stopEvent(event);
    },
    touchcancel: () => {
      if (state.pending) {
        stopPendingDrag();
        return;
      }
      cancel();
    },
    resize: cancel,
    // A window scroll will cancel a pending or current drag
    // This will be looked at when auto scrolling is supported
    scroll: cancel,
    // long press can bring up a context menu
    // need to opt out of this behavior
    contextmenu: stopEvent,
    // Need to opt out of dragging if the user is a force press
    // Only for safari which has decided to introduce its own custom way of doing things
    // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
    webkitmouseforcechanged: (event: MouseForceChangedEvent) => {
      if (isForcePress(event)) {
        cancel();
      }
    },
  };

  const eventKeys = Object.keys(windowBindings);

  const bindWindowEvents = () => {
    eventKeys.forEach((eventKey: string) => {
      const fn: Function = windowBindings[eventKey];

      if (eventKey === 'touchmove') {
        // opting out of passive touchmove (default) so as to prevent scrolling while moving
        // Not worried about performance as effect of move is throttled in requestAnimationFrame
        window.addEventListener(eventKey, fn, { passive: false });
        return;
      }

      window.addEventListener(eventKey, fn);
    });
  };

  const unbindWindowEvents = () => {
    eventKeys.forEach((eventKey: string) =>
      window.removeEventListener(eventKey, windowBindings[eventKey]));
  };

  // entry point
  const onTouchStart = (event: TouchEvent, props: Props) => {
    if (!props.canLift) {
      return;
    }

    if (isCapturing()) {
      console.error('should not be able to perform a touch start while a drag or pending drag is occurring');
      cancel();
      return;
    }

    const { clientX, clientY } = event.touches[0];
    const point: Position = {
      x: clientX,
      y: clientY,
    };

    // Need to call preventDefault() in order to prevent native scrolling from occurring
    // However, this will also swallow the click event. So if a pending drag is determined to be a
    // tap then we need to manually trigger the click event.
    stopEvent(event);

    startPendingDrag(point);
  };

  const sensor: TouchSensor = {
    onTouchStart,
    kill,
    isCapturing,
    isDragging,
  };

  return sensor;
};
