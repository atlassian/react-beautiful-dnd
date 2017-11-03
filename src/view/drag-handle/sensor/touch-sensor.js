// @flow
import stopEvent from '../stop-event';
import createScheduler from '../create-scheduler';
import isSloppyClickThresholdExceeded from '../is-sloppy-click-threshold-exceeded';
import * as keyCodes from '../../key-codes';
import blockStandardKeyEvents from '../util/block-standard-key-events';
import type {
  Position,
} from '../../../types';
import type {
  Callbacks,
  TouchSensor,
  Props,
} from '../drag-handle-types';

type State = {
  isDragging: boolean,
  pending: ?Position,
}

export default (callbacks: Callbacks): TouchSensor => {
  const state: State = {
    isDragging: false,
    pending: null,
  };
  const setState = (newState: State): void => {
    state = newState;
  };
  const isDragging = (): boolean => state.isDragging;
  const isCapturing = (): boolean => Boolean(state.pending || state.isDragging);
  const schedule = createScheduler(callbacks, isDragging);

  const onTouchStart = (event: TouchEvent) => {
    // TODO
  };

  const sensor: TouchSensor = {
    onTouchStart,
    end: () => console.warn('end not yet implemented'),
    isCapturing,
    isDragging,
  };
};
