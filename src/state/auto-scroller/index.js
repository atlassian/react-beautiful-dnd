// @flow
import { type Position } from 'css-box-model';
import createFluidScroller, { type FluidScroller } from './fluid-scroller';
import createJumpScroller, { type JumpScroller } from './jump-scroller';
import type { AutoScroller } from './auto-scroller-types';
import { move as moveAction } from '../action-creators';
import type {
  DraggableId,
  DroppableId,
  State,
  Viewport,
} from '../../types';

type Args = {|
  scrollDroppable: (id: DroppableId, change: Position) => void,
  scrollWindow: (change: Position) => void,
  move: typeof moveAction,
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

  const marshal: AutoScroller = {
    cancel: fluidScroll.cancel,
    fluidScroll,
    jumpScroll,
  };

  return marshal;
};

