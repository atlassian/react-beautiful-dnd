// @flow
import type { Position, Area } from '../types';
import getArea from '../state/get-area';
import getWindowScroll from './get-window-scroll';

export default (): Area => {
  const windowScroll: Position = getWindowScroll();

  const top: number = windowScroll.y;
  const left: number = windowScroll.x;

  const doc: HTMLElement = (document.documentElement : any);

  // Using these values as they do not consider scrollbars
  const width: number = doc.clientWidth;
  const height: number = doc.clientHeight;

  // Computed
  const right: number = left + width;
  const bottom: number = top + height;

  return getArea({
    top, left, right, bottom,
  });
};
