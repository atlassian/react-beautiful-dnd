// @flow

import type { Position } from 'css-box-model';
import forEach, { type BlockFnArgs } from './util/for-each';
import type { Viewport } from '../../../../../src/types';
import { scrollableViewport } from './util/viewport';
import scrollViewport from '../../../../../src/state/scroll-viewport';
import dragTo from './util/drag-to';
import getScroller, {
  type PublicArgs,
  type FluidScroller,
} from '../../../../../src/state/auto-scroller/fluid-scroller';
import getDistanceThresholds, {
  type DistanceThresholds,
} from '../../../../../src/state/auto-scroller/fluid-scroller/get-scroll/get-scroll-on-axis/get-distance-thresholds';
import {
  patch,
  add,
  subtract,
  negate,
} from '../../../../../src/state/position';
import getArgsMock from './util/get-args-mock';
import config from '../../../../../src/state/auto-scroller/fluid-scroller/config';

forEach(({ axis, state }: BlockFnArgs) => {
  const thresholds: DistanceThresholds = getDistanceThresholds(
    scrollableViewport.frame,
    axis,
  );

  describe('moving forward to end of window', () => {
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
    const noScrollTarget: Position = subtract(
      onStartBoundary,
      patch(axis.line, 1),
    );

    const startWithNoScroll = (scroller: FluidScroller) => {
      scroller.start(
        dragTo({
          selection: noScrollTarget,
          viewport: scrollableViewport,
          state,
        }),
      );
      requestAnimationFrame.step();
    };
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
      requestAnimationFrame.step();
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

    it('should get faster the closer to the max speed point', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const atStartOfRange: Position = onStartBoundary;
      const atEndOfRange: Position = subtract(
        onMaxBoundary,
        patch(axis.line, 1),
      );

      // start the drag with no auto scrolling
      // this will opt out of time dampening
      startWithNoScroll(scroller);
      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      scroller.scroll(
        dragTo({
          selection: atStartOfRange,
          viewport: scrollableViewport,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);
      const scroll1: Position = (mocks.scrollWindow.mock.calls[0][0]: any);

      scroller.scroll(
        dragTo({
          selection: atEndOfRange,
          viewport: scrollableViewport,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(2);
      const scroll2: Position = (mocks.scrollWindow.mock.calls[1][0]: any);

      expect(scroll1[axis.line]).toBeLessThan(scroll2[axis.line]);

      // validation
      expect(scroll1[axis.crossAxisLine]).toBe(0);
      expect(scroll2[axis.crossAxisLine]).toBe(0);
    });

    it('should have the top speed at the max speed point', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);

      startWithNoScroll(scroller);
      scroller.scroll(
        dragTo({
          selection: onMaxBoundary,
          viewport: scrollableViewport,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledWith(
        patch(axis.line, config.maxPixelScroll),
      );
    });

    it('should have the top speed when moving beyond the max speed point', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const target: Position = add(onMaxBoundary, patch(axis.line, 1));

      startWithNoScroll(scroller);
      scroller.scroll(
        dragTo({
          selection: target,
          viewport: scrollableViewport,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledWith(
        patch(axis.line, config.maxPixelScroll),
      );
    });

    it('should throttle multiple scrolls into a single animation frame', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const target1: Position = add(onStartBoundary, patch(axis.line, 1));
      const target2: Position = subtract(onMaxBoundary, patch(axis.line, 1));

      startWithNoScroll(scroller);
      scroller.scroll(
        dragTo({
          selection: target1,
          viewport: scrollableViewport,
          state,
        }),
      );
      scroller.scroll(
        dragTo({
          selection: target2,
          viewport: scrollableViewport,
          state,
        }),
      );

      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);
      expect(mocks.scrollWindow).toHaveBeenCalledWith(
        patch(axis.line, config.maxPixelScroll),
      );
    });
  });

  describe('moving backward to start of window', () => {
    const windowScroll: Position = patch(axis.line, 10);
    const scrolledViewport: Viewport = scrollViewport(
      scrollableViewport,
      windowScroll,
    );

    const onStartBoundary: Position = patch(
      axis.line,
      // at the boundary is not enough to start
      windowScroll[axis.line] + thresholds.startScrollingFrom,
      scrolledViewport.frame.center[axis.crossAxisLine],
    );
    const onMaxBoundary: Position = patch(
      axis.line,
      windowScroll[axis.line] + thresholds.maxScrollValueAt,
      scrolledViewport.frame.center[axis.crossAxisLine],
    );
    const noScrollTarget: Position = add(onStartBoundary, patch(axis.line, 1));

    const startWithNoScroll = (scroller: FluidScroller) => {
      scroller.start(
        dragTo({
          selection: noScrollTarget,
          viewport: scrollableViewport,
          state,
        }),
      );
      requestAnimationFrame.step();
    };

    it('should not scroll if before the start threshold', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const target: Position = add(onStartBoundary, patch(axis.line, 1));

      scroller.start(
        dragTo({
          selection: target,
          viewport: scrolledViewport,
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
          viewport: scrolledViewport,
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
      const target: Position = subtract(onStartBoundary, patch(axis.line, 1));

      scroller.start(
        dragTo({
          selection: target,
          viewport: scrolledViewport,
          state,
        }),
      );

      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      // only called after a frame
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalled();
      // moving forwards
      const request: Position = mocks.scrollWindow.mock.calls[0][0];
      expect(request[axis.line]).toBeLessThan(0);
    });

    it('should get faster the closer to the max speed point', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const atStartOfRange: Position = onStartBoundary;
      const atEndOfRange: Position = add(onMaxBoundary, patch(axis.line, 1));

      // start the drag with no auto scrolling
      // this will opt out of time dampening
      startWithNoScroll(scroller);
      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      scroller.scroll(
        dragTo({
          selection: atStartOfRange,
          viewport: scrolledViewport,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);
      const scroll1: Position = (mocks.scrollWindow.mock.calls[0][0]: any);

      scroller.scroll(
        dragTo({
          selection: atEndOfRange,
          viewport: scrolledViewport,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(2);
      const scroll2: Position = (mocks.scrollWindow.mock.calls[1][0]: any);

      expect(scroll1[axis.line]).toBeGreaterThan(scroll2[axis.line]);

      // validation
      expect(scroll1[axis.crossAxisLine]).toBe(0);
      expect(scroll2[axis.crossAxisLine]).toBe(0);
    });

    it('should have the top speed at the max speed point', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);

      startWithNoScroll(scroller);
      scroller.scroll(
        dragTo({
          selection: onMaxBoundary,
          viewport: scrolledViewport,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledWith(
        negate(patch(axis.line, config.maxPixelScroll)),
      );
    });

    it('should have the top speed when moving beyond the max speed point', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const target: Position = subtract(onMaxBoundary, patch(axis.line, 1));

      startWithNoScroll(scroller);
      scroller.scroll(
        dragTo({
          selection: target,
          viewport: scrolledViewport,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledWith(
        negate(patch(axis.line, config.maxPixelScroll)),
      );
    });

    it('should throttle multiple scrolls into a single animation frame', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const target1: Position = subtract(onStartBoundary, patch(axis.line, 1));
      const target2: Position = add(onMaxBoundary, patch(axis.line, 1));

      startWithNoScroll(scroller);
      scroller.scroll(
        dragTo({
          selection: target1,
          viewport: scrolledViewport,
          state,
        }),
      );
      scroller.scroll(
        dragTo({
          selection: target2,
          viewport: scrolledViewport,
          state,
        }),
      );

      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);
      expect(mocks.scrollWindow).toHaveBeenCalledWith(
        negate(patch(axis.line, config.maxPixelScroll)),
      );
    });
  });
});
