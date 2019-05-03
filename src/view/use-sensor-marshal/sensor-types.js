// @flow
import type { Position } from 'css-box-model';
import type { MovementMode } from '../../types';

export type CaptureEndOptions = {|
  shouldBlockNextClick: boolean,
|};

export type MovementCallbacks = {|
  shouldRespectForcePress: () => boolean,
  // getDragHandleRef: () => HTMLElement,
  // getDraggableRef: () => HTMLElement,
  onLift: ({
    clientSelection: Position,
    movementMode: MovementMode,
  }) => void,
  onMove: (point: Position) => void,
  onWindowScroll: () => void,
  onMoveUp: () => void,
  onMoveDown: () => void,
  onMoveRight: () => void,
  onMoveLeft: () => void,
  onDrop: (args: CaptureEndOptions) => void,
  onCancel: (args: CaptureEndOptions) => void,
  onAbort: () => void,
|};

export type SensorHook = (
  tryStartCapturing: (source: Event | Element) => ?MovementCallbacks,
) => void;
