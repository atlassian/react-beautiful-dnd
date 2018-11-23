// @flow
import type { Position, Rect } from 'css-box-model';
import type { Viewport } from '../../../types';
import getRequiredScroll from './get-required-scroll';
import { canScrollWindow } from '../can-scroll';

type Args = {|
  viewport: Viewport,
  subject: Rect,
  center: Position,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
|};

export default ({
  viewport,
  subject,
  center,
  dragStartTime,
  shouldUseTimeDampening,
}: Args): ?Position => {
  const scroll: ?Position = getRequiredScroll({
    dragStartTime,
    container: viewport.frame,
    subject,
    center,
    shouldUseTimeDampening,
  });

  return scroll && canScrollWindow(viewport, scroll) ? scroll : null;
};
