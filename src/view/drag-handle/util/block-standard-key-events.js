// @flow
import * as keyCodes from '../../key-codes';
import stopEvent from './stop-event';

type KeyMap = {
  [key: number]: true
}

const blocked: KeyMap = {
  // submission
  [keyCodes.enter]: true,
  // tabbing
  [keyCodes.tab]: true,
};

export default (event: KeyboardEvent) => {
  if (blocked[event.keyCode]) {
    stopEvent(event);
  }
};
