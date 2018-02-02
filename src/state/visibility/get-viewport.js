// @flow
import type { Position, Area } from '../../types';
import getArea from '../get-area';
import getWindowScrollPosition from '../../view/get-window-scroll-position';

export default (): Area => {
  const windowScroll: Position = getWindowScrollPosition();

  const top: number = windowScroll.y;
  const left: number = windowScroll.x;

  const doc: HTMLElement = (document.documentElement : any);

  console.log('doc top', document.documentElement.scrollTop);
  console.log('window', window.pageYOffset);

  // using these values as they do not consider scrollbars
  const width: number = doc.clientWidth;
  const height: number = doc.clientHeight;

  // computed
  const right: number = left + width;
  const bottom: number = top + height;

  return getArea({
    top, left, right, bottom,
  });
};
