// @flow
import * as keyCodes from '../../key-codes';
import stopEvent from './stop-event';

const blocked: number[] = [
  // submission
  keyCodes.enter,
  // tabbing
  keyCodes.tab,
];

export default (event: KeyboardEvent) => {
  if (blocked.indexOf(event.keyCode) >= 0) {
    stopEvent(event);
  }
};
