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
  // TODO: ie11?
  if (blocked.includes(event.keyCode)) {
    stopEvent(event);
  }
};
