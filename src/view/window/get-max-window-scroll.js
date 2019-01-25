// @flow
import type { Position } from 'css-box-model';
import getMaxScroll from '../../state/get-max-scroll';
import getDocumentElement from '../get-document-element';

export default (): Position => {
  const doc: HTMLElement = getDocumentElement();

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
