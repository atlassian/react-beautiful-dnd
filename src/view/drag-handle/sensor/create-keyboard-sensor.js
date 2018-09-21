// @flow
/* eslint-disable no-use-before-define */
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import createScheduler from '../util/create-scheduler';
import preventStandardKeyEvents from '../util/prevent-standard-key-events';
import * as keyCodes from '../../key-codes';
import getBorderBoxCenterPosition from '../../get-border-box-center-position';
import { bindEvents, unbindEvents } from '../util/bind-events';
import supportedPageVisibilityEventName from '../util/supported-page-visibility-event-name';
import type { EventBinding } from '../util/event-types';
import type { KeyboardSensor, CreateSensorArgs } from './sensor-types';

type State = {|
  isDragging: boolean,
|};

type KeyMap = {
  [key: number]: true,
};

const scrollJumpKeys: KeyMap = {
  [keyCodes.pageDown]: true,
  [keyCodes.pageUp]: true,
  [keyCodes.home]: true,
  [keyCodes.end]: true,
};

const noop = () => {};

export default ({
  callbacks,
  getWindow,
  getDraggableRef,
  canStartCapturing,
}: CreateSensorArgs): KeyboardSensor => {
  let state: State = {
    isDragging: false,
  };
  const setState = (newState: State): void => {
    state = newState;
  };
  const startDragging = (fn?: Function = noop) => {
    setState({
      isDragging: true,
    });
    bindWindowEvents();
    fn();
  };
  const stopDragging = (fn?: Function = noop) => {
    schedule.cancel();
    unbindWindowEvents();
    setState({ isDragging: false });
    fn();
  };
  const kill = () => {
    if (state.isDragging) {
      stopDragging();
    }
  };
  const cancel = () => {
    stopDragging(callbacks.onCancel);
  };
  const isDragging = (): boolean => state.isDragging;
  const schedule = createScheduler(callbacks);

  const onKeyDown = (event: KeyboardEvent) => {
    // not yet dragging
    if (!isDragging()) {
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

      const ref: ?HTMLElement = getDraggableRef();

      invariant(ref, 'Cannot start a keyboard drag without a draggable ref');

      // using center position as selection
      const center: Position = getBorderBoxCenterPosition(ref);

      // we are using this event for part of the drag
      event.preventDefault();
      startDragging(() =>
        callbacks.onLift({
          clientSelection: center,
          movementMode: 'JUMP',
        }),
      );
      return;
    }

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
      stopDragging(callbacks.onDrop);
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
  };

  const windowBindings: EventBinding[] = [
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
      fn: callbacks.onWindowScroll,
    },
    // Cancel on page visibility change
    {
      eventName: supportedPageVisibilityEventName,
      fn: cancel,
    },
  ];

  const bindWindowEvents = () => {
    bindEvents(getWindow(), windowBindings, { capture: true });
  };

  const unbindWindowEvents = () => {
    unbindEvents(getWindow(), windowBindings, { capture: true });
  };

  const sensor: KeyboardSensor = {
    onKeyDown,
    kill,
    isDragging,
    // a drag starts instantly so capturing is the same as dragging
    isCapturing: isDragging,
    // no additional cleanup needed other then what it is kill
    unmount: kill,
  };

  return sensor;
};
