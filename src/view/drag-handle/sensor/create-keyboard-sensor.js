// @flow
/* eslint-disable no-use-before-define */
import stopEvent from '../util/stop-event';
import createScheduler from '../util/create-scheduler';
import blockStandardKeyEvents from '../util/block-standard-key-events';
import * as keyCodes from '../../key-codes';
import getWindowFromRef from '../../get-window-from-ref';
import getCenterPosition from '../../get-center-position';
import type { Position } from '../../../types';
import type { KeyboardSensor, CreateSensorArgs } from './sensor-types';
import type {
  Props,
} from '../drag-handle-types';

type State = {|
  isDragging: boolean,
|}

type ExecuteBasedOnDirection = {|
  vertical: () => void,
  horizontal: () => void,
|}

const noop = () => { };

const scrollJumpKeys: number[] = [
  keyCodes.pageDown, keyCodes.pageUp, keyCodes.home, keyCodes.end,
];

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
    setState({
      isDragging: false,
    });
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
      // cannot lift at this time
      if (!canStartCapturing(event)) {
        return;
      }

      if (event.keyCode !== keyCodes.space) {
        return;
      }

      stopEvent(event);

      const ref: ?HTMLElement = getDraggableRef();

      if (!ref) {
        console.error('cannot start a keyboard drag without a draggable ref');
        return;
      }

      // using center position as selection
      const center: Position = getCenterPosition(ref);

      startDragging(() => callbacks.onLift({
        client: center,
        autoScrollMode: 'JUMP',
      }));
      return;
    }

    // Cancelling
    if (event.keyCode === keyCodes.escape) {
      stopEvent(event);
      cancel();
      return;
    }

    // Dropping
    if (event.keyCode === keyCodes.space) {
      // need to stop parent Draggable's thinking this is a lift
      stopEvent(event);
      stopDragging(callbacks.onDrop);
      return;
    }

    // Movement

    // already dragging
    if (!direction) {
      console.error('Cannot handle keyboard movement event if direction is not provided');
      stopEvent(event);
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
      stopEvent(event);
      executeBasedOnDirection({
        vertical: schedule.moveForward,
        horizontal: schedule.crossAxisMoveForward,
      });
      return;
    }

    if (event.keyCode === keyCodes.arrowUp) {
      stopEvent(event);
      executeBasedOnDirection({
        vertical: schedule.moveBackward,
        horizontal: schedule.crossAxisMoveBackward,
      });
      return;
    }

    if (event.keyCode === keyCodes.arrowRight) {
      stopEvent(event);
      executeBasedOnDirection({
        vertical: schedule.crossAxisMoveForward,
        horizontal: schedule.moveForward,
      });
      return;
    }

    if (event.keyCode === keyCodes.arrowLeft) {
      stopEvent(event);
      executeBasedOnDirection({
        vertical: schedule.crossAxisMoveBackward,
        horizontal: schedule.moveBackward,
      });
    }

    blockStandardKeyEvents(event);

    // blocking scroll jumping at this time
    if (scrollJumpKeys.indexOf(event.keyCode) >= 0) {
      stopEvent(event);
    }
  };

  const windowBindings = {
    // any mouse actions kills a drag
    mousedown: cancel,
    mouseup: cancel,
    click: cancel,
    // resizing the browser kills a drag
    resize: cancel,
    // kill if the user is using the mouse wheel
    // We are not supporting wheel / trackpad scrolling with keyboard dragging
    wheel: cancel,
    // Need to respond instantly to a jump scroll request
    // Not using the scheduler
    scroll: callbacks.onWindowScroll,
  };

  const eventKeys: string[] = Object.keys(windowBindings);

  const bindWindowEvents = () => {
    const win: HTMLElement = getWindowFromRef(getDraggableRef());

    eventKeys.forEach((eventKey: string) => {
      win.addEventListener(eventKey, windowBindings[eventKey]);
    });
  };

  const unbindWindowEvents = () => {
    const win: HTMLElement = getWindowFromRef(getDraggableRef());

    eventKeys.forEach((eventKey: string) => {
      win.removeEventListener(eventKey, windowBindings[eventKey]);
    });
  };

  const sensor: KeyboardSensor = {
    onKeyDown,
    kill,
    isDragging,
    // a drag starts instantly so capturing is the same as dragging
    isCapturing: isDragging,
  };

  return sensor;
};

