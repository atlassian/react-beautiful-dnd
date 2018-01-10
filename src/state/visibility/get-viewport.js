// @flow
import type { Area } from '../../types';
import getArea from '../get-area';

export default (): Area => {
  // would use window.scrollY and window.scrollX but it is not supported in ie11
  const top: number = window.pageYOffset;
  const left: number = window.pageXOffset;
  const width: number = window.innerWidth;
  const height: number = window.innerHeight;

  // computed
  const right: number = left + width;
  const bottom: number = top + height;

  return getArea({
    top, left, right, bottom,
  });
};
