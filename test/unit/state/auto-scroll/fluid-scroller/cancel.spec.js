// @flow
import type { Position } from 'css-box-model';
import forEach, { type BlockFnArgs } from './util/for-each';
import getMocks from './util/get-args-mock';
import { scrollableViewport } from './util/viewport';
import dragTo from './util/drag-to';
import getScroller, {
  type PublicArgs,
  type FluidScroller,
} from '../../../../../src/state/auto-scroller/fluid-scroller';
import { patch } from '../../../../../src/state/position';

forEach(({ axis, state }: BlockFnArgs) => {
  it('should cancel any pending window scroll', () => {
    const wouldScroll: Position = patch(
      axis.line,
      // to the boundary is not enough to start
      scrollableViewport.frame[axis.end],
    );

    {
      const mocks: PublicArgs = getMocks();
      const scroller: FluidScroller = getScroller(mocks);

      scroller.start(
        dragTo({
          selection: wouldScroll,
          viewport: scrollableViewport,
          state,
        }),
      );

      // not flushing frame
      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      scroller.cancelPending();

      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    }

    // validation (no cancel)
    {
      const mocks: PublicArgs = getMocks();
      const scroller: FluidScroller = getScroller(mocks);

      scroller.start(
        dragTo({
          selection: wouldScroll,
          viewport: scrollableViewport,
          state,
        }),
      );

      expect(mocks.scrollWindow).not.toHaveBeenCalled();
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalled();
    }
  });

  it('should cancel any pending droppable scroll', () => {
    throw new Error('TODO');
  });
});
