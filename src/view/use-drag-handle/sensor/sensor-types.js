// @flow
import type { Callbacks } from '../drag-handle-types';

type SensorBase = {|
  // force stop and do not fire any events
  kill: () => void,
  // Is the sensor currently recording a drag
  isDragging: () => boolean,
  // Is the sensor listening for events.
  // This can happen before a drag starts
  isCapturing: () => boolean,
  // perform any cleanup tasks required when unmounting
  unmount: () => void,
|};

export type CreateSensorArgs = {|
  callbacks: Callbacks,
  getDraggableRef: () => ?HTMLElement,
  getWindow: () => HTMLElement,
  canStartCapturing: (event: Event) => boolean,
  getShouldRespectForceTouch: () => boolean,
|};

export type MouseSensor = {|
  ...SensorBase,
  onMouseDown: (event: MouseEvent) => void,
|};

export type KeyboardSensor = {|
  ...SensorBase,
  onKeyDown: (event: KeyboardEvent) => void,
|};

export type TouchSensor = {|
  ...SensorBase,
  onTouchStart: (event: TouchEvent) => void,
|};

export type Sensor = MouseSensor | KeyboardSensor | TouchSensor;
