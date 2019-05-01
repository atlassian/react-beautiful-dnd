// @flow
import type { Position } from 'css-box-model';
import type { MovementMode, DraggableId } from '../../types';

export type SensorHookArgsOld = {|
  // Capture lifecycle
  canStartCapturing: (id: DraggableId) => boolean,
  canStartCapturingFromEvent: (event: Event) => boolean,
  onCaptureStart: (abort: () => void) => void,
  onCaptureEnd: () => void,

  // Can only call after capturing has started

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

type IdlePhase = {|
  type: 'IDLE',
  callbacks: {|
    tryStartCapturing: (event: Event) => boolean,
  |},
|};

type CapturingPhase = {|
  type: 'CAPTURING',
  callbacks: {|
    getDragHandleRef: () => HTMLElement,
    getDraggableRef: () => HTMLElement,
    onLift: ({|
      clientSelection: Position,
      movementMode: MovementMode,
    |}) => void,
    onMove: (point: Position) => void,
    onWindowScroll: () => void,
    onMoveUp: () => void,
    onMoveDown: () => void,
    onMoveRight: () => void,
    onMoveLeft: () => void,
    onDrop: () => void,
    onCancel: () => void,
  |},
|};

export type Phase = IdlePhase | CapturingPhase;

export type SensorHook = (getPhase: () => Phase) => void;
