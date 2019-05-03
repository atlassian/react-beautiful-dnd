// @flow
import type { Position } from 'css-box-model';
import type { MovementMode } from '../../types';

export type CaptureEndOptions = {|
  shouldBlockNextClick: boolean,
|};

type SnapLift = {|
  mode: 'SNAP',
|};

type FluidLift = {|
  mode: 'FLUID',
  clientSelection: Position,
|};

export type OnLiftArgs = SnapLift | FluidLift;

export type MovementCallbacks = {|
  shouldRespectForcePress: () => boolean,
  // getDragHandleRef: () => HTMLElement,
  // getDraggableRef: () => HTMLElement,
  onLift: (args: OnLiftArgs) => void,
  onMove: (point: Position) => void,
  onWindowScroll: () => void,
  onMoveUp: () => void,
  onMoveDown: () => void,
  onMoveRight: () => void,
  onMoveLeft: () => void,
  onDrop: (args?: CaptureEndOptions) => void,
  onCancel: (args?: CaptureEndOptions) => void,
  onAbort: () => void,
|};

export type SensorHook = (
  tryStartCapturing: (source: Event | Element) => ?MovementCallbacks,
) => void;
