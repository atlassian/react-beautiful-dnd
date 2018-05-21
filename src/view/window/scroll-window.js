// @flow
import { type Position } from 'css-box-model';
import { subtract } from '../../state/position';
import getWindowScroll from './get-window-scroll';

// Not guarenteed to scroll by the entire amount
export default (change: Position): void => {
  console.warn('scrolling window by', change);
  window.scrollBy(change.x, change.y);
};

