// @flow
import scrollWindow from './scroll-window';
import createFluidScroller, { type FluidScroller } from './create-fluid-scroller';
import createJumpScroller, { type JumpScroller } from './create-jump-scroller';
import { move as moveAction } from '../action-creators';
import type { AutoScroller } from './auto-scroller-types';
import type {
  DroppableId,
  Position,
  State,
} from '../../types';

type Args = {|
  scrollDroppable: (id: DroppableId, change: Position) => void,
  move: typeof moveAction,
|}

export default ({
  scrollDroppable,
  move,
}: Args): AutoScroller => {
  const fluidScroll: FluidScroller = createFluidScroller({
    scrollWindow,
    scrollDroppable,
  });

  const jumpScroll: JumpScroller = createJumpScroller({
    move,
    scrollWindow,
    scrollDroppable,
  });

  const onStateChange = (previous: State, current: State): void => {
    // now dragging
    if (current.phase === 'DRAGGING') {
      if (!current.drag) {
        console.error('invalid drag state');
        return;
      }

      if (current.drag.initial.autoScrollMode === 'FLUID') {
        fluidScroll(current);
        return;
      }

      // autoScrollMode == 'JUMP'

      if (!current.drag.scrollJumpRequest) {
        return;
      }

      jumpScroll(current);
    }

    // cancel any pending scrolls if no longer dragging
    if (previous.phase === 'DRAGGING' && current.phase !== 'DRAGGING') {
      fluidScroll.cancel();
    }
  };

  const marshal: AutoScroller = {
    onStateChange,
  };

  return marshal;
};

