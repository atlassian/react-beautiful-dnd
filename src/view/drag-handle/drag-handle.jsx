// @flow
import { Component } from 'react';
import invariant from 'invariant';
import memoizeOne from 'memoize-one';
import rafSchedule from 'raf-schd';
// Using keyCode's for consistent event pattern matching between
// React synthetic events as well as raw browser events.
import * as keyCodes from '../key-codes';
import getWindowFromRef from '../get-window-from-ref';
import type { Position, HTMLElement } from '../../types';
import type {
  Props,
  Provided,
  Sensor,
  MouseSensor,
  KeyboardSensor,
} from './drag-handle-types';
import createMouseSensor from './sensor/create-mouse-sensor';
import createKeyboardSensor from './sensor/create-keyboard-sensor';

const getFalse: () => boolean = () => false;

type SensorMap = {|
  mouse: MouseSensor,
  keyboard: KeyboardSensor,
  // touch: TouchSensor,
|}

export default class DragHandle extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  mouseSensor: MouseSensor = createMouseSensor(this.props.callbacks);
  keyboardSensor: KeyboardSensor = createKeyboardSensor(this.props.callbacks);
  sensors: Sensor[] = [this.mouseSensor, this.keyboardSensor];

  componentWillUnmount() {
    this.sensors.forEach((sensor: Sensor) => {
      // kill the current drag and fire a cancel event if
      const wasCapturing = sensor.isCapturing();
      const wasDragging = sensor.isDragging();

      // stop capturing
      if (wasCapturing) {
        sensor.kill();
      }
      // cancel if drag was occuring
      if (wasDragging) {
        this.props.callbacks.onCancel();
      }
    });
  }

  componentWillReceiveProps(nextProps: Props) {
    // if the application cancels a drag we need to unbind the handlers
    const isDragStopping: boolean = (this.props.isDragging && !nextProps.isDragging);

    if (!isDragStopping) {
      return;
    }

    this.sensors.forEach((sensor: Sensor) => {
      if (sensor.isCapturing()) {
        sensor.kill();
        // not firing any cancel event as the drag is already over
      }
    });
  }

  onKeyDown = (event: MouseEvent) => {
    // let the mouse sensor deal with it
    if (this.mouseSensor.isCapturing()) {
      return;
    }

    this.keyboardSensor.onKeyDown(event, this.props);
  }

  onMouseDown = (event: MouseEvent) => {
    // let the keyboard sensor deal with it
    if (this.keyboardSensor.isCapturing()) {
      return;
    }

    this.mouseSensor.onMouseDown(event, this.props);
  }

  onTouchStart = (event: TouchEvent) => {
    if (!this.props.canLift) {
      return;
    }

    // let the keyboard sensor deal with it
    if (this.mouseSensor.isCapturing() || this.keyboardSensor.isCapturing()) {
      console.error('mouse or keyboard already listening when attempting to touch drag');
      return;
    }

    this.touchSensor.start(event);
  }

  isSensorDragging = () =>
    this.sensors.some((sensor: Sensor) => sensor.isDragging())

  getProvided = memoizeOne((isEnabled: boolean, isDragging: boolean): ?Provided => {
    if (!isEnabled) {
      return null;
    }

    const provided: Provided = {
      onMouseDown: this.onMouseDown,
      onKeyDown: this.onKeyDown,
      onTouchStart: this.onTouchStart,
      onClick: this.mouseSensor.onClick,
      tabIndex: 0,
      'aria-grabbed': isDragging,
      draggable: false,
      onDragStart: getFalse,
      onDrop: getFalse,
    };

    return provided;
  })

  render() {
    const { children, isEnabled } = this.props;

    return children(this.getProvided(isEnabled, this.isSensorDragging()));
  }
}
