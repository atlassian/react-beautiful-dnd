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

export default (callbacks: Callbacks): TouchSensor => {
  const state: State = {
    isDragging: false,
    pending: null,
  };
};
