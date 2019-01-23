// @flow
export default (el: ?HTMLElement): typeof window =>
  el && el.ownerDocument ? el.ownerDocument.defaultView : window;
