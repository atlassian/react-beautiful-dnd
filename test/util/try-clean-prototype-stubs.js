// @flow
export default () => {
  // clean up any stubs
  if (Element.prototype.getBoundingClientRect.mockRestore) {
    Element.prototype.getBoundingClientRect.mockRestore();
  }
  if (window.getComputedStyle.mockRestore) {
    window.getComputedStyle.mockRestore();
  }
};
