// @flow
import { type Position } from 'css-box-model';
import createFluidScroller, { type FluidScroller } from './fluid-scroller';
import createJumpScroller, { type JumpScroller } from './jump-scroller';
import type { AutoScroller } from './auto-scroller-types';
import type { DroppableId } from '../../types';
import type { MoveArgs } from '../action-creators';

type Args = {|
  scrollDroppable: (id: DroppableId, change: Position) => void,
  move: (args: MoveArgs) => mixed,
  scrollWindow: (offset: Position) => void,
|};

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
