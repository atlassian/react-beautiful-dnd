// @flow
// https://allyjs.io/tutorials/hiding-elements.html
// Element is visually hidden but is readable by screen readers
const assignVisuallyHidden = (style: Object) => {
  style.position = 'absolute';
  style.width = '1px';
  style.height = '1px';
  style.margin = '-1px';
  style.border = '0';
  style.padding = '0';
  style.overflow = 'hidden';
  style.clip = 'rect(0 0 0 0)';
  style['clip-path'] = 'inset(100%)';
};

export default assignVisuallyHidden;
