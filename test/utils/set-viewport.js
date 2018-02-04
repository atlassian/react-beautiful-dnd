// @flow
import type { Area } from '../../src/types';
import getArea from '../../src/state/get-area';

const setViewport = (custom: Area) => {
  window.pageYOffset = custom.top;
  window.pageXOffset = custom.left;
  window.innerWidth = custom.width;
  window.innerHeight = custom.height;
};

export const getCurrent = (): Area => getArea({
  top: window.pageYOffset,
  left: window.pageXOffset,
  width: window.innerWidth,
  height: window.innerHeight,
});

const original: Area = getCurrent();

export const resetViewport = () => setViewport(original);

export default setViewport;
