// @flow
import type { Position, Rect } from 'css-box-model';
import type { Viewport } from '../../../types';
import getScroll from './get-scroll';
import { canScrollWindow } from '../can-scroll';

type Args = {|
  viewport: Viewport,
  subject: Rect,
  center: Position,
  centerIntitial: Position,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
|};

export default ({
  viewport,
  subject,
  center,
  centerIntitial,
  dragStartTime,
  shouldUseTimeDampening,
}: Args): ?Position => {
  const scroll: ?Position = getScroll({
    dragStartTime,
    container: viewport.frame,
    subject,
    center,
    centerIntitial,
    shouldUseTimeDampening,
  });

  return scroll && canScrollWindow(viewport, scroll) ? scroll : null;
};
