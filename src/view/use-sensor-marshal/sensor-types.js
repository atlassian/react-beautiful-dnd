// @flow
import type { Position } from 'css-box-model';
import type { MovementMode, DraggableId } from '../../types';

export type SensorHookArgs = {|
  // Capture lifecycle
  canStartCapturing: (id: DraggableId) => boolean,
  canStartCapturingFromEvent: (event: Event) => boolean,
  onCaptureStart: (abort: () => void) => void,
  onCaptureEnd: () => void,

  // Drag movement
  onLift: ({|
    id: DraggableId,
    clientSelection: Position,
    movementMode: MovementMode,
  |}) => mixed,
  onMove: (point: Position) => mixed,
  onWindowScroll: () => mixed,
  onMoveUp: () => mixed,
  onMoveDown: () => mixed,
  onMoveRight: () => mixed,
  onMoveLeft: () => mixed,
  onDrop: () => mixed,
  onCancel: () => mixed,
|};

export type SensorHook = (args: SensorHookArgs) => void;
