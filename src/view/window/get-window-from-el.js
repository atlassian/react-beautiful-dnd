// @flow
export default (el: ?Element): typeof window =>
  el && el.ownerDocument ? el.ownerDocument.defaultView : window;
