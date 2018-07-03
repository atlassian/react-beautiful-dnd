// @flow
export default (ref: ?HTMLElement): HTMLElement =>
  ref ? ref.ownerDocument.defaultView : window;
