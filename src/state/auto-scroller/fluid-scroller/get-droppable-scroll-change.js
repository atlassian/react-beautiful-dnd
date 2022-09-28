// @flow
import type { Position, Rect } from 'css-box-model';
import type {
  DroppableDimension,
  FluidScrollerOptions,
  Scrollable,
} from '../../../types';
import getScroll from './get-scroll';
import { canScrollDroppable } from '../can-scroll';

type Args = {|
  droppable: DroppableDimension,
  subject: Rect,
  center: Position,
  centerIntitial: Position,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
  fluidScrollerOptions?: FluidScrollerOptions,
|};

export default ({
  droppable,
  subject,
  center,
  centerIntitial,
  dragStartTime,
  shouldUseTimeDampening,
  fluidScrollerOptions,
}: Args): ?Position => {
  // We know this has a closestScrollable
  const frame: ?Scrollable = droppable.frame;

  // this should never happen - just being safe
  if (!frame) {
    return null;
  }

  const scroll: ?Position = getScroll({
    dragStartTime,
    container: frame.pageMarginBox,
    subject,
    center,
    centerIntitial,
    shouldUseTimeDampening,
    fluidScrollerOptions,
  });

  return scroll && canScrollDroppable(droppable, scroll) ? scroll : null;
};
