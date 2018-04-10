// @flow
/* eslint-disable no-use-before-define */
import createScheduler from '../util/create-scheduler';
import preventStandardKeyEvents from '../util/prevent-standard-key-events';
import * as keyCodes from '../../key-codes';
import getWindowFromRef from '../../get-window-from-ref';
import getCenterPosition from '../../get-center-position';
import { bindEvents, unbindEvents } from '../util/bind-events';
import supportedPageVisibilityEventName from '../util/supported-page-visibility-event-name';
import type { EventBinding } from '../util/event-types';
import type { Position } from '../../../types';
import type { KeyboardSensor, CreateSensorArgs } from './sensor-types';
import type {
  Props,
} from '../drag-handle-types';

type State = {|
  isDragging: boolean,
|}

type ExecuteBasedOnDirection = {|
  vertical: Function,
  horizontal: Function,
|}

type KeyMap = {
  [key: number]: true
}

const scrollJumpKeys: KeyMap = {
  [keyCodes.pageDown]: true,
  [keyCodes.pageUp]: true,
  [keyCodes.home]: true,
  [keyCodes.end]: true,
};

const noop = () => { };

export default ({
  callbacks,
  getDraggableRef,
  canStartCapturing,
}: CreateSensorArgs): KeyboardSensor => {
  let state: State = {
    isDragging: false,
  };
  const setState = (newState: State): void => {
    state = newState;
  };
  const getWindow = (): HTMLElement => getWindowFromRef(getDraggableRef());

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
  const kill = () => stopDragging();
  const cancel = () => {
    stopDragging(callbacks.onCancel);
  };
  const isDragging = (): boolean => state.isDragging;
  const schedule = createScheduler(callbacks);

  const onKeyDown = (event: KeyboardEvent, props: Props) => {
    const { direction } = props;

    // not yet dragging
    if (!isDragging()) {
      // We may already be lifting on a child draggable.
      // We do not need to use an EventMarshal here as
      // we always call preventDefault on the first input
      if (event.defaultPrevented) {
        return;
      }

      // cannot lift at this time
      if (!canStartCapturing(event)) {
        return;
      }

      if (event.keyCode !== keyCodes.space) {
        return;
      }

      const ref: ?HTMLElement = getDraggableRef();

      if (!ref) {
        console.error('cannot start a keyboard drag without a draggable ref');
        return;
      }

      // using center position as selection
      const center: Position = getCenterPosition(ref);

      // we are using this event for part of the drag
      event.preventDefault();
      startDragging(() => callbacks.onLift({
        client: center,
        autoScrollMode: 'JUMP',
      }));
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

    // already dragging
    if (!direction) {
      console.error('Cannot handle keyboard movement event if direction is not provided');
      // calling prevent default here as the action resulted in the drop
      // this one is border line
      event.preventDefault();
      cancel();
      return;
    }

    const executeBasedOnDirection = (fns: ExecuteBasedOnDirection) => {
      if (direction === 'vertical') {
        fns.vertical();
        return;
      }
      fns.horizontal();
    };

    if (event.keyCode === keyCodes.arrowDown) {
      event.preventDefault();
      executeBasedOnDirection({
        vertical: schedule.moveForward,
        horizontal: schedule.crossAxisMoveForward,
      });
      return;
    }

    if (event.keyCode === keyCodes.arrowUp) {
      event.preventDefault();
      executeBasedOnDirection({
        vertical: schedule.moveBackward,
        horizontal: schedule.crossAxisMoveBackward,
      });
      return;
    }

    if (event.keyCode === keyCodes.arrowRight) {
      event.preventDefault();
      executeBasedOnDirection({
        vertical: schedule.crossAxisMoveForward,
        horizontal: schedule.moveForward,
      });
      return;
    }

    if (event.keyCode === keyCodes.arrowLeft) {
      event.preventDefault();
      executeBasedOnDirection({
        vertical: schedule.crossAxisMoveBackward,
        horizontal: schedule.moveBackward,
      });
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
    },
    // Need to respond instantly to a jump scroll request
    // Not using the scheduler
    {
      eventName: 'scroll',
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

