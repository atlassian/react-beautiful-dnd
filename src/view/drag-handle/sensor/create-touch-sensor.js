// @flow
/* eslint-disable no-use-before-define */
import stopEvent from '../util/stop-event';
import createScheduler from '../util/create-scheduler';
import getWindowFromRef from '../../get-window-from-ref';
import shouldAllowDraggingFromTarget from '../util/should-allow-dragging-from-target';
import type {
  Position,
} from '../../../types';
import type {
  Props,
} from '../drag-handle-types';
import type { TouchSensor, CreateSensorArgs } from './sensor-types';

type State = {
  isDragging: boolean,
  hasMoved: boolean,
  preventClick: boolean,
  longPressTimerId: ?number,
  pending: ?Position,
}

type TouchWithForce = Touch & {
  force: number
}

export const timeForLongPress: number = 150;
export const forcePressThreshold: number = 0.15;

const noop = (): void => { };

const initial: State = {
  isDragging: false,
  pending: null,
  hasMoved: false,
  preventClick: false,
  longPressTimerId: null,
};

export default ({ callbacks, getDraggableRef, canStartCapturing }: CreateSensorArgs): TouchSensor => {
  let state: State = initial;

  const setState = (partial: Object): void => {
    state = {
      ...state,
      ...partial,
    };
  };
  const isDragging = (): boolean => state.isDragging;
  const isCapturing = (): boolean =>
    Boolean(state.pending || state.isDragging || state.longPressTimerId);
  const schedule = createScheduler(callbacks, isDragging);

  const startDragging = () => {
    const pending: ?Position = state.pending;

    if (!pending) {
      console.error('cannot start a touch drag without a pending position');
      kill();
      return;
    }

    setState({
      isDragging: true,
      // has not moved from original position yet
      hasMoved: false,
      // no longer relevant
      pending: null,
      longPressTimerId: null,
    });

    callbacks.onLift({
      client: pending,
      // not allowing container scrolling for touch movements at this stage
      isScrollAllowed: false,
    });
  };
  const stopDragging = (fn?: Function = noop) => {
    unbindWindowEvents();
    setState({
      ...initial,
      preventClick: true,
    });
    fn();
  };

  const startPendingDrag = (event: TouchEvent) => {
    const touch: Touch = event.touches[0];
    const { clientX, clientY } = touch;
    const point: Position = {
      x: clientX,
      y: clientY,
    };

    const longPressTimerId: number = setTimeout(startDragging, timeForLongPress);

    setState({
      longPressTimerId,
      pending: point,
      isDragging: false,
      hasMoved: false,
    });
    bindWindowEvents();
  };

  const stopPendingDrag = () => {
    clearTimeout(state.longPressTimerId);
    unbindWindowEvents();

    setState(initial);
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
      // Drag has not yet started and we are waiting for a long press.
      if (state.pending) {
        stopPendingDrag();
        return;
      }

      // At this point we are dragging

      if (!state.hasMoved) {
        setState({
          hasMoved: true,
        });
      }

      stopEvent(event);

      const { clientX, clientY } = event.touches[0];

      const point: Position = {
        x: clientX,
        y: clientY,
      };

      // already dragging
      schedule.move(point);
    },
    touchend: (event: TouchEvent) => {
      if (state.pending) {
        stopPendingDrag();
        // not stopping the event as this can be registered as a tap
        return;
      }

      // already dragging
      stopDragging(callbacks.onDrop);
      stopEvent(event);
    },
    touchcancel: cancel,
    touchstart: () => {
      // this will also intercept the initial touchstart

      // This should never happen - but just being super safe
      if (isDragging()) {
        console.error('touch start fired while already dragging');
        cancel();
      }
    },
    // If the orientation of the device changes - kill the drag
    // https://davidwalsh.name/orientation-change
    orientationchange: cancel,
    // some devices fire resize if the orientation changes
    resize: cancel,
    // A window scroll will cancel a pending or current drag.
    // This should not happen as we are calling preventDefault in touchmove,
    // but just being extra safe
    scroll: cancel,
    // Long press can bring up a context menu
    // need to opt out of this behavior
    contextmenu: stopEvent,
    // On some devices it is possible to have a touch interface with a keyboard.
    // On any keyboard event we cancel a touch drag
    keydown: cancel,
    // Need to opt out of dragging if the user is a force press
    // Only for safari which has decided to introduce its own custom way of doing things
    // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
    touchforcechange: (event: TouchEvent) => {
      // force push action will no longer fire after a touchmove
      if (state.hasMoved) {
        return;
      }

      const touch: TouchWithForce = (event.touches[0] : any);

      if (touch.force >= forcePressThreshold) {
        cancel();
      }
    },
  };

  const eventKeys = Object.keys(windowBindings);

  const bindWindowEvents = () => {
    const win: HTMLElement = getWindowFromRef(getDraggableRef());

    eventKeys.forEach((eventKey: string) => {
      const fn: Function = windowBindings[eventKey];

      if (eventKey === 'touchmove') {
        // opting out of passive touchmove (default) so as to prevent scrolling while moving
        // Not worried about performance as effect of move is throttled in requestAnimationFrame
        win.addEventListener(eventKey, fn, { passive: false });
        return;
      }

      win.addEventListener(eventKey, fn);
    });
  };

  const unbindWindowEvents = () => {
    const win: HTMLElement = getWindowFromRef(getDraggableRef());

    eventKeys.forEach((eventKey: string) =>
      win.removeEventListener(eventKey, windowBindings[eventKey]));
  };

  // entry point
  const onTouchStart = (event: TouchEvent) => {
    if (!canStartCapturing(event)) {
      return;
    }

    if (isCapturing()) {
      console.error('should not be able to perform a touch start while a drag or pending drag is occurring');
      cancel();
      return;
    }

    // We need to stop parents from responding to this event - which may cause a double lift
    // We also need to NOT call event.preventDefault() so as to maintain as much standard
    // browser interactions as possible.
    // event.preventDefault() in an onTouchStart blocks almost
    // every other event including force press
    event.stopPropagation();

    startPendingDrag(event);
  };

  // a touch move can happen very quickly - before the window handlers are bound
  // so we need to also add some logic here to ensure that a pending drag is cancelled if needed
  const onTouchMove = () => {
    if (state.pending) {
      stopPendingDrag();
    }
  };

  const onClick = (event: MouseEvent) => {
    if (!state.preventClick) {
      return;
    }

    stopEvent(event);
    setState(initial);
  };

  const sensor: TouchSensor = {
    onTouchStart,
    onTouchMove,
    onClick,
    kill,
    isCapturing,
    isDragging,
  };

  return sensor;
};
