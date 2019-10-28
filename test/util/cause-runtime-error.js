// @flow
export function getRuntimeError(): Event {
  return new window.ErrorEvent('error', {
    error: new Error('non-rbd'),
    cancelable: true,
  });
}

export default function causeRuntimeError() {
  window.dispatchEvent(getRuntimeError());
}
