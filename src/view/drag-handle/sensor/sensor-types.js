// @flow
import type { Props } from '../drag-handle-types';

type Sensor = {|
  // force stop and do not fire any events
  kill: () => void,
  // Is the sensor currently recording a drag
  isDragging: () => boolean,
  // Is the sensor listening for events.
  // This can happen before a drag starts
  isCapturing: () => boolean,
|}

export type MouseSensor = {
  ...Sensor,
  onMouseDown: (event: MouseEvent, props: Props) => void,
  onClick: (event: MouseEvent) => void,
}

export type KeyboardSensor = {
  ...Sensor,
  onKeyDown: (event: MouseEvent, props: Props) => void,
}
