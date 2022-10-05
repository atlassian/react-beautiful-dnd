// @flow
import { type Position, type Rect } from 'css-box-model';
import type {
  DraggingState,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  FluidScrollerOptions,
  Viewport,
} from '../../../types';
import getBestScrollableDroppable from './get-best-scrollable-droppable';
import whatIsDraggedOver from '../../droppable/what-is-dragged-over';
import getWindowScrollChange from './get-window-scroll-change';
import getDroppableScrollChange from './get-droppable-scroll-change';

type Args = {|
  state: DraggingState,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
  scrollWindow: (scroll: Position) => void,
  scrollDroppable: (id: DroppableId, scroll: Position) => void,
  fluidScrollerOptions?: FluidScrollerOptions,
|};

export default ({
  state,
  dragStartTime,
  shouldUseTimeDampening,
  scrollWindow,
  scrollDroppable,
  fluidScrollerOptions,
}: Args): void => {
  const center: Position = state.current.page.borderBoxCenter;
  const centerIntitial = state.initial.page.borderBoxCenter;
  const draggable: DraggableDimension =
    state.dimensions.draggables[state.critical.draggable.id];
  const subject: Rect = draggable.page.marginBox;
  // 1. Can we scroll the viewport?
  if (state.isWindowScrollAllowed) {
    const viewport: Viewport = state.viewport;
    const change: ?Position = getWindowScrollChange({
      dragStartTime,
      viewport,
      subject,
      center,
      centerIntitial,
      shouldUseTimeDampening,
      fluidScrollerOptions,
    });

    if (change) {
      scrollWindow(change);
      return;
    }
  }

  const droppable: ?DroppableDimension = getBestScrollableDroppable({
    center,
    destination: whatIsDraggedOver(state.impact),
    droppables: state.dimensions.droppables,
  });

  if (!droppable) {
    return;
  }

  const change: ?Position = getDroppableScrollChange({
    dragStartTime,
    droppable,
    subject,
    center,
    centerIntitial,
    shouldUseTimeDampening,
    fluidScrollerOptions,
  });

  if (change) {
    scrollDroppable(droppable.descriptor.id, change);
  }
};
