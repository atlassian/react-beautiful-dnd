// @flow
import type { Position } from 'css-box-model';
import getBody from '../get-body';
import getMaxScroll from '../../state/get-max-scroll';

export default (): Position => {
  const body: HTMLBodyElement = getBody();

  const maxScroll: Position = getMaxScroll({
    // unclipped padding box, with scrollbar
    scrollHeight: body.scrollHeight,
    scrollWidth: body.scrollWidth,
    // clipped padding box, without scrollbar
    width: body.clientWidth,
    height: body.clientHeight,
  });

  return maxScroll;
};
