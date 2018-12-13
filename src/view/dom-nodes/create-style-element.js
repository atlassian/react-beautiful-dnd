// @flow
export default (): HTMLStyleElement => {
  const el: HTMLStyleElement = document.createElement('style');
  el.type = 'text/css';
  return el;
};
