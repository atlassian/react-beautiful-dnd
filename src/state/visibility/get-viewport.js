// @flow
import type { ClientRect } from '../../types';

export default (): ClientRect => {
  // would use window.scrollY and window.scrollX but it is not supported in ie11
  const top: number = window.pageYOffset;
  const left: number = window.pageXOffset;
  const width: number = window.innerWidth;
  const height: number = window.innerHeight;

  // computed
  const right: number = left + width;
  const bottom: number = top + height;

  const rect: ClientRect = {
    top, right, bottom, left, width, height,
  };
  return rect;
};
