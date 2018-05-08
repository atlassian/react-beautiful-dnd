// @flow
import { type Position } from 'css-box-model';
import createFluidScroller, { type FluidScroller } from './fluid-scroller';
import createJumpScroller, { type JumpScroller } from './jump-scroller';
import type { AutoScroller } from './auto-scroller-types';
import type {
  DraggableId,
  DroppableId,
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

    if (current.phase === 'DRAGGING' || current.phase === 'BULK_COLLECTING') {
      if (current.autoScrollMode === 'FLUID') {
        fluidScroll(current);
        return;
      }

      // autoScrollMode == 'JUMP'

      if (!current.scrollJumpRequest) {
        return;
      }

      jumpScroll(current);
      return;
    }

    // Not currently dragging
    // Was previously dragging
    if (previous.phase === 'DRAGGING' || previous.phase === 'BULK_COLLECTING') {
      fluidScroll.cancel();
    }
  };

  const marshal: AutoScroller = {
    onStateChange,
  };

  return marshal;
};

