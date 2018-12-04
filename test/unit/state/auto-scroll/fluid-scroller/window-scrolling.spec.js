// @flow

import type { Position } from 'css-box-model';
import forEach, { type BlockFnArgs } from './util/for-each';
import type { DraggingState } from '../../../../../src/types';
import { scrollableViewport } from './util/viewport';
import dragTo from './util/drag-to';
import getScroller, {
  type PublicArgs,
  type FluidScroller,
} from '../../../../../src/state/auto-scroller/fluid-scroller';
import getDistanceThresholds, {
  type DistanceThresholds,
} from '../../../../../src/state/auto-scroller/fluid-scroller/get-scroll/get-scroll-on-axis/get-distance-thresholds';
import { patch, add, subtract } from '../../../../../src/state/position';
import getArgsMock from './util/get-args-mock';

forEach(({ axis, state, preset }: BlockFnArgs) => {
  const thresholds: DistanceThresholds = getDistanceThresholds(
    scrollableViewport.frame,
    axis,
  );
  const onStartBoundary: Position = patch(
    axis.line,
    // to the boundary is not enough to start
    scrollableViewport.frame[axis.size] - thresholds.startScrollingFrom,
    scrollableViewport.frame.center[axis.crossAxisLine],
  );
  const onMaxBoundary: Position = patch(
    axis.line,
    scrollableViewport.frame[axis.size] - thresholds.maxScrollValueAt,
    scrollableViewport.frame.center[axis.crossAxisLine],
  );

  describe('moving forward to end of window', () => {
    it('should not scroll if before the start threshold', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const target: Position = subtract(onStartBoundary, patch(axis.line, 1));

      scroller.start(
        dragTo({
          selection: target,
          viewport: scrollableViewport,
          state,
        }),
      );

      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    });

    it('should scroll if on the start threshold', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);

      scroller.start(
        dragTo({
          selection: onStartBoundary,
          viewport: scrollableViewport,
          state,
        }),
      );

      expect(mocks.scrollWindow).not.toHaveBeenCalled();
      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).toHaveBeenCalled();
    });

    it('should scroll if moving beyond the start threshold', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const target: Position = add(onStartBoundary, patch(axis.line, 1));

      scroller.start(
        dragTo({
          selection: target,
          viewport: scrollableViewport,
          state,
        }),
      );

      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      // only called after a frame
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalled();
      // moving forwards
      const request: Position = mocks.scrollWindow.mock.calls[0][0];
      expect(request[axis.line]).toBeGreaterThan(0);
    });
  });
});
