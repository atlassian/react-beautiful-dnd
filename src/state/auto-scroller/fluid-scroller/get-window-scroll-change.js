// @flow
import type { Position, Rect } from 'css-box-model';
import type { FluidScrollerOptions, Viewport } from '../../../types';
import getScroll from './get-scroll';
import { canScrollWindow } from '../can-scroll';

type Args = {|
  viewport: Viewport,
  subject: Rect,
  center: Position,
  centerInitial: Position,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
  fluidScrollerOptions?: FluidScrollerOptions,
|};

export default ({
  viewport,
  subject,
  center,
  centerInitial,
  dragStartTime,
  shouldUseTimeDampening,
  fluidScrollerOptions,
}: Args): ?Position => {
  const scroll: ?Position = getScroll({
    dragStartTime,
    container: viewport.frame,
    containerScroll: viewport.scroll,
    subject,
    center,
    centerInitial,
    shouldUseTimeDampening,
    fluidScrollerOptions,
  });

  return scroll && canScrollWindow(viewport, scroll) ? scroll : null;
};
