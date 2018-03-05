// @flow
import type {
  Position,
} from '../../types';

// Not guarenteed to scroll by the entire amount
export default (change: Position): void => {
  window.scrollBy(change.x, change.y);
};

