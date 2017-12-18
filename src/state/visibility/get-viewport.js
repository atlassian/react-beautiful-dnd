// @flow
import type { ClientRect } from '../../types';

export default (): ClientRect => {
  const top: number = window.scrollY;
  const left: number = window.scrollX;
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
