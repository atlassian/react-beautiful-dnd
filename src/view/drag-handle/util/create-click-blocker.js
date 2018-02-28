// @flow
import stopEvent from './stop-event';

export type ClickBlocker = {|
  blockNext: () => void,
  reset: () => void,
|}

export default (): ClickBlocker => {
  let isBound: boolean = false;
  let expireTimerId: ?number = null;

  const clearExpireTimeout = () => {
    if (!expireTimerId) {
      console.error('Cannot clear expire timeout when there is none');
      return;
    }
    clearTimeout(expireTimerId);
    expireTimerId = null;
  };

  const reset = (): void => {
    // already unbound.
    // This function can be called defensively by consumers so we
    // are not logging any errors here
    if (!isBound) {
      return;
    }

    // no need to continue the expire timeout
    // if it is still pending
    if (expireTimerId) {
      clearExpireTimeout();
    }
    isBound = false;
    // eslint-disable-next-line no-use-before-define
    window.removeEventListener('click', onWindowClick, { capture: true });
  };

  const onWindowClick = (event: MouseEvent) => {
    stopEvent(event);
    // unbinding self after single use
    reset();
  };

  const blockNext = (): void => {
    if (isBound) {
      console.error('Cannot block next click while already blocking the next click');
      return;
    }

    // if we have a click timeout pending
    // we need to clear it so that it does not reset
    // this new listening phase
    if (expireTimerId) {
      clearExpireTimeout();
    }
    isBound = true;
    window.addEventListener('click', onWindowClick, { capture: true });

    // Only block clicks for the current call stack
    // after this we can allow clicks again.
    // This is to guard against the situation where a click event does
    // not fire on the element. In that case we do not want to block a click
    // on another element
    expireTimerId = setTimeout(reset);
  };

  const blocker: ClickBlocker = {
    blockNext,
    reset,
  };

  return blocker;
};
