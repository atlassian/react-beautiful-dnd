// @flow
import type { Position } from 'css-box-model';
import forEach, { type BlockFnArgs } from './util/for-each';
import getMocks from './util/get-args-mock';
import { scrollableViewport, unscrollableViewport } from './util/viewport';
import dragTo from './util/drag-to';
import getScroller, {
  type FluidScroller,
} from '../../../../../src/state/auto-scroller/fluid-scroller';
import { patch } from '../../../../../src/state/position';
import getDroppable from './util/get-droppable';

forEach(({ axis, state, preset }: BlockFnArgs) => {
  it('should cancel any pending window scroll', () => {
    const wouldScroll: Position = patch(
      axis.line,
      // to the boundary is not enough to start
      scrollableViewport.frame[axis.end],
    );

    {
      const mocks = getMocks();
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
      const mocks = getMocks();
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
    const { scrollable, frameClient } = getDroppable(preset);
    const wouldScroll: Position = patch(
      axis.line,
      frameClient.borderBox[axis.end],
    );

    {
      const mocks = getMocks();
      const scroller: FluidScroller = getScroller(mocks);

      scroller.start(
        dragTo({
          selection: wouldScroll,
          viewport: unscrollableViewport,
          state,
          droppable: scrollable,
        }),
      );

      // not flushing frame
      expect(mocks.scrollDroppable).not.toHaveBeenCalled();

      scroller.cancelPending();

      requestAnimationFrame.flush();
      expect(mocks.scrollDroppable).not.toHaveBeenCalled();
    }

    // validation (no cancel)
    {
      const mocks = getMocks();
      const scroller: FluidScroller = getScroller(mocks);

      scroller.start(
        dragTo({
          selection: wouldScroll,
          viewport: unscrollableViewport,
          state,
          droppable: scrollable,
        }),
      );

      expect(mocks.scrollDroppable).not.toHaveBeenCalled();
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalled();
    }
  });
});
