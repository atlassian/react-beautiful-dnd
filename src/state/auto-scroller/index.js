// @flow
import createFluidScroller, { type FluidScroller } from './fluid-scroller';
import createJumpScroller, { type JumpScroller } from './jump-scroller';
import type { AutoScroller } from './auto-scroller-types';
import type {
  DraggableId,
  DroppableId,
  Position,
  State,
  Viewport,
} from '../../types';

type Args = {|
  scrollDroppable: (id: DroppableId, change: Position) => void,
  scrollWindow: (change: Position) => void,
  move: (
    id: DraggableId,
    client: Position,
    viewport: Viewport,
    shouldAnimate?: boolean
  ) => void,
|}

export default ({
  scrollDroppable,
  scrollWindow,
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
      return;
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

