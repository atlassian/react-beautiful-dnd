// @flow
/* eslint-disable no-use-before-define */
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import createScheduler from '../util/create-scheduler';
import isSloppyClickThresholdExceeded from '../util/is-sloppy-click-threshold-exceeded';
import * as keyCodes from '../../key-codes';
import preventStandardKeyEvents from '../util/prevent-standard-key-events';
import createPostDragEventPreventer, {
  type EventPreventer,
} from '../util/create-post-drag-event-preventer';
import { bindEvents, unbindEvents } from '../util/bind-events';
import createEventMarshal, {
  type EventMarshal,
} from '../util/create-event-marshal';
import supportedPageVisibilityEventName from '../util/supported-page-visibility-event-name';
import type { EventBinding } from '../util/event-types';
import type { PointerSensor, CreateSensorArgs } from './sensor-types';
import { warning } from '../../../dev-warning';

type State = {|
  isDragging: boolean,
  pending: ?Position,
|};

const noop = () => {};

// shared management of mousedown without needing to call preventDefault()
const mouseDownMarshal: EventMarshal = createEventMarshal();

export default ({
  callbacks,
  getWindow,
  canStartCapturing,
}: CreateSensorArgs): PointerSensor => {
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
  const postDragEventPreventer: EventPreventer = createPostDragEventPreventer(
    getWindow,
  );

  const startDragging = (fn?: Function = noop) => {
    setState({
      pending: null,
      isDragging: true,
    });
    fn();
  };
  const stopDragging = (
    fn?: Function = noop,
    shouldBlockClick?: boolean = true,
  ) => {
    schedule.cancel();
    unbindWindowEvents();
    mouseDownMarshal.reset();
    if (shouldBlockClick) {
      postDragEventPreventer.preventNext();
    }
    setState({
      isDragging: false,
      pending: null,
    });
    fn();
  };
  const startPendingDrag = (point: Position) => {
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
    if (state.isDragging) {
      stopDragging(fn);
    }
  };

  const unmount = (): void => {
    kill();
    postDragEventPreventer.abort();
  };

  const cancel = () => {
    kill(callbacks.onCancel);
  };

  const windowBindings: EventBinding[] = [
    {
      eventName: 'pointermove',
      fn: (event: PointerEvent) => {
        console.log('pointermove');

        // preventing default as we are using this event
        event.preventDefault();
        const clientX = event.clientX;
        const clientY = event.clientY;

        const point: Position = {
          x: clientX,
          y: clientY,
        };

        // Already dragging
        if (state.isDragging) {
          // preventing default as we are using this event
          event.preventDefault();
          schedule.move(point);
          return;
        }

        // There should be a pending drag at this point

        if (!state.pending) {
          // this should be an impossible state
          // we cannot use kill directly as it checks if there is a pending drag
          stopPendingDrag();
          invariant(
            false,
            'Expected there to be an active or pending drag when window pointermove event is received',
          );
        }

        startDragging(() =>
          callbacks.onLift({
            clientSelection: point,
            movementMode: 'FLUID',
          }),
        );
      },
    },
    {
      eventName: 'pointerup',
      fn: (event: PointerEvent) => {
        console.log('pointerup');
        if (state.pending) {
          stopPendingDrag();
          return;
        }

        // preventing default as we are using this event
        event.preventDefault();
        stopDragging(callbacks.onDrop);
      },
    },
    {
      eventName: 'pointerdown',
      fn: (event: PointerEvent) => {
        console.log('pointerdown');
        // this can happen during a drag when the user clicks a button
        // other than the primary mouse button
        // if (state.isDragging) {
          event.preventDefault();
        // }
        stopDragging(callbacks.onCancel);
      },
    },
    {
      eventName: 'mousemove',
      fn: (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
      },
    },
    {
      eventName: 'lostpointercapture',
      fn: (event: Event) => {
        console.log('lostpointercapture');

        event.preventDefault();
        event.stopPropagation();
      },
    },
    // Cancel on page visibility change
    {
      eventName: supportedPageVisibilityEventName,
      fn: cancel,
    },
  ];

  const bindWindowEvents = () => {
    const win: HTMLElement = getWindow();
    bindEvents(win, windowBindings, { capture: true });
  };

  const unbindWindowEvents = () => {
    const win: HTMLElement = getWindow();
    unbindEvents(win, windowBindings, { capture: true });
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (mouseDownMarshal.isHandled()) {
      return;
    }

    invariant(
      !isCapturing(),
      'Should not be able to perform a mouse down while a drag or pending drag is occurring',
    );

    // We do not need to prevent the event on a dropping draggable as
    // the mouse down event will not fire due to pointer-events: none
    // https://codesandbox.io/s/oxo0o775rz
    if (!canStartCapturing(event)) {
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
  };

  const sensor: PointerSensor = {
    onPointerDown,
    kill,
    isCapturing,
    isDragging,
    unmount,
  };

  return sensor;
};
