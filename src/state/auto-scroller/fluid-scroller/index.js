// @flow
import rafSchd from 'raf-schd';
import { type Position } from 'css-box-model';
import type { DraggingState, DroppableId } from '../../../types';
import scroll from './scroll';
import { invariant } from '../../../invariant';
import * as timings from '../../../debug/timings';

export type PublicArgs = {|
  scrollWindow: (change: Position) => void,
  scrollDroppable: (id: DroppableId, change: Position) => void,
|};

export type FluidScroller = {|
  scroll: (state: DraggingState) => void,
  start: (state: DraggingState) => void,
  stop: () => void,
|};

type WhileDragging = {|
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
|};

export default ({
  scrollWindow,
  scrollDroppable,
}: PublicArgs): FluidScroller => {
  const scheduleWindowScroll = rafSchd(scrollWindow);
  const scheduleDroppableScroll = rafSchd(scrollDroppable);
  let dragging: ?WhileDragging = null;

  const tryScroll = (state: DraggingState): void => {
    invariant(dragging, 'Cannot fluid scroll if not dragging');
    const { shouldUseTimeDampening, dragStartTime } = dragging;

    scroll({
      state,
      scrollWindow: scheduleWindowScroll,
      scrollDroppable: scheduleDroppableScroll,
      dragStartTime,
      shouldUseTimeDampening,
    });
  };

  const start = (state: DraggingState) => {
    timings.start('starting fluid scroller');
    invariant(!dragging, 'Cannot start auto scrolling when already started');
    const dragStartTime: number = Date.now();

    let wasScrollNeeded: boolean = false;
    const fakeScrollCallback = () => {
      wasScrollNeeded = true;
    };
    scroll({
      state,
      dragStartTime: 0,
      shouldUseTimeDampening: false,
      scrollWindow: fakeScrollCallback,
      scrollDroppable: fakeScrollCallback,
    });

    dragging = {
      dragStartTime,
      shouldUseTimeDampening: wasScrollNeeded,
    };
    timings.finish('starting fluid scroller');

    // we know an auto scroll is needed - let's do it!
    if (wasScrollNeeded) {
      tryScroll(state);
    }
  };

  const stop = () => {
    // can be called defensively
    if (!dragging) {
      return;
    }
    scheduleWindowScroll.cancel();
    scheduleDroppableScroll.cancel();
    dragging = null;
  };

  return {
    start,
    stop,
    scroll: tryScroll,
  };
};
