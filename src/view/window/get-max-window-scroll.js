// @flow
import type { Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import getMaxScroll from '../../state/get-max-scroll';

export default (): Position => {
  const doc: ?HTMLElement = document.documentElement;
  invariant(doc, 'Cannot get max scroll without a document');

  const maxScroll: Position = getMaxScroll({
    // unclipped padding box, with scrollbar
    scrollHeight: doc.scrollHeight,
    scrollWidth: doc.scrollWidth,
    // clipped padding box, without scrollbar
    width: doc.clientWidth,
    height: doc.clientHeight,
  });

  return maxScroll;
};
