// @flow

export default function causeRuntimeError() {
  const event: Event = new window.ErrorEvent('error', {
    error: new Error('non-rbd'),
  });
  window.dispatchEvent(event);
}
