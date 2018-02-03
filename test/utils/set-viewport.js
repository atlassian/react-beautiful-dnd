// @flow

export default (custom: Area, scroll: Position): void => {
  window.pageYOffset = custom.top;
  window.pageXOffset = custom.left;
  window.innerWidth = custom.width;
  window.innerHeight = custom.height;
};
