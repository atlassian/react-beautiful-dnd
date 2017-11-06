// @flow
/* eslint-disable no-use-before-define */
import stopEvent from '../stop-event';
import createScheduler from '../create-scheduler';
import isSloppyClickThresholdExceeded from '../is-sloppy-click-threshold-exceeded';
import type {
  Position,
} from '../../../types';
import type {
  Callbacks,
  TouchSensor,
  Props,
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
    console.log('drag starting');
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
    console.log('starting pending drag');
    const startTimerId: number = setTimeout(
      () => startDragging(callbacks.onLift(point)),
      200
    );
    setState({
      startTimerId,
      pending: point,
    });
    bindWindowEvents();
  };

  const stopPendingDrag = () => {
    console.log('stopping pending drag');
    clearTimeout(state.startTimerId);
    unbindWindowEvents();

    setState({
      startTimerId: null,
      pending: null,
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
          stopPendingDrag();
          // not stopping event - releasing it as we are no longer interested
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
    // A window scroll will cancel a pending or current drag
    // This will be looked at when auto scrolling is supported
    scroll: cancel,
    // long press can bring up a context menu
    // need to opt out of this behavior
    contextmenu: stopEvent,
    webkitmouseforcechanged: (event: Event) => {
      console.warn('not yet handled');
    },
  };

  const eventKeys = Object.keys(windowBindings);

  const bindWindowEvents = () => {
    eventKeys.forEach((eventKey: string) => {
      if (eventKey === 'touchmove') {
        // opting out of passive touchmove (default) so as to prevent scrolling while moving
        // Not worried about performance as effect of move is throttled in requestAnimationFrame
        window.addEventListener(eventKey, windowBindings.touchmove, { passive: false });
        return;
      }

      window.addEventListener(eventKey, windowBindings[eventKey]);
    });
  };

  const unbindWindowEvents = () => {
    console.log('unbinding window events');
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
