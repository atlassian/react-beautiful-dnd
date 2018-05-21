// @flow
import { type Position } from 'css-box-model';

// Not guarenteed to scroll by the entire amount
export default (change: Position): void => {
  window.scrollBy(change.x, change.y);
};

