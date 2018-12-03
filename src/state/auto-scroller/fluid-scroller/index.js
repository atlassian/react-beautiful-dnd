// @flow
import rafSchd from 'raf-schd';
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import type { DraggingState, DroppableId } from '../../../types';
import scroll from './scroll';

export type PublicArgs = {|
  scrollWindow: (change: Position) => void,
  scrollDroppable: (id: DroppableId, change: Position) => void,
|};

export type FluidScroller = {|
  scroll: (state: DraggingState) => void,
  start: (state: DraggingState) => void,
  stop: () => void,
  cancelPending: () => void,
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

  const cancelPending = () => {
    invariant(dragging, 'Cannot cancel pending fluid scroll when not started');
    scheduleWindowScroll.cancel();
    scheduleDroppableScroll.cancel();
  };

  const start = (state: DraggingState) => {
    invariant(!dragging, 'Cannot start auto scrolling when already started');
    const dragStartTime: number = Date.now();

    const shouldUseTimeDampening: boolean = (() => {
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

      return wasScrollNeeded;
    })();

    dragging = {
      dragStartTime,
      shouldUseTimeDampening,
    };
  };

  const stop = () => {
    // can be called defensively
    if (!dragging) {
      return;
    }
    cancelPending();
    dragging = null;
  };

  return {
    start,
    stop,
    cancelPending,
    scroll: tryScroll,
  };
};
