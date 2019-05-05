// @flow
import type { Position } from 'css-box-model';

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
  lift: (args: OnLiftArgs) => void,
  move: (point: Position) => void,
  moveUp: () => void,
  moveDown: () => void,
  moveRight: () => void,
  moveLeft: () => void,
  drop: (args?: CaptureEndOptions) => void,
  cancel: (args?: CaptureEndOptions) => void,
  abort: () => void,
|};

export type SensorHook = (
  tryStartCapturing: (source: Event | Element) => ?MovementCallbacks,
) => void;
