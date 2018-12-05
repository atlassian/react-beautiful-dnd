// @flow
import type { Position } from 'css-box-model';
import forEach, { type BlockFnArgs } from './util/for-each';
import type { DroppableDimension } from '../../../../../src/types';
import { unscrollableViewport } from './util/viewport';
import getDroppable from './util/get-droppable';
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
import scrollDroppable from '../../../../../src/state/droppable/scroll-droppable';

forEach(({ axis, state, preset }: BlockFnArgs) => {
  const { scrollable, frameClient } = getDroppable(preset);
  const thresholds: DistanceThresholds = getDistanceThresholds(
    frameClient.borderBox,
    axis,
  );

  describe('moving forward to end of droppable', () => {
    const onStartBoundary: Position = patch(
      axis.line,
      // to the boundary is not enough to start
      frameClient.borderBox[axis.size] - thresholds.startScrollingFrom,
      frameClient.borderBox.center[axis.crossAxisLine],
    );
    const onMaxBoundary: Position = patch(
      axis.line,
      frameClient.borderBox[axis.size] - thresholds.maxScrollValueAt,
      frameClient.borderBox.center[axis.crossAxisLine],
    );
    const noScrollTarget: Position = subtract(
      onStartBoundary,
      patch(axis.line, 1),
    );

    const startWithNoScroll = (scroller: FluidScroller) => {
      scroller.start(
        dragTo({
          selection: noScrollTarget,
          viewport: unscrollableViewport,
          droppable: scrollable,
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
          viewport: unscrollableViewport,
          droppable: scrollable,
          state,
        }),
      );

      requestAnimationFrame.flush();
      expect(mocks.scrollDroppable).not.toHaveBeenCalled();
    });

    it('should scroll if on the start threshold', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);

      scroller.start(
        dragTo({
          selection: onStartBoundary,
          viewport: unscrollableViewport,
          droppable: scrollable,
          state,
        }),
      );

      expect(mocks.scrollDroppable).not.toHaveBeenCalled();
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalled();
    });

    it('should scroll if moving beyond the start threshold', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const target: Position = add(onStartBoundary, patch(axis.line, 1));

      scroller.start(
        dragTo({
          selection: target,
          viewport: unscrollableViewport,
          droppable: scrollable,
          state,
        }),
      );

      expect(mocks.scrollDroppable).not.toHaveBeenCalled();

      // only called after a frame
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalled();
      // moving forwards
      const id: Position = mocks.scrollDroppable.mock.calls[0][0];
      const request: Position = mocks.scrollDroppable.mock.calls[0][1];
      expect(id).toEqual(scrollable.descriptor.id);
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
      expect(mocks.scrollDroppable).not.toHaveBeenCalled();

      scroller.scroll(
        dragTo({
          selection: atStartOfRange,
          viewport: unscrollableViewport,
          droppable: scrollable,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalledTimes(1);
      const scroll1: Position = (mocks.scrollDroppable.mock.calls[0][1]: any);

      scroller.scroll(
        dragTo({
          selection: atEndOfRange,
          viewport: unscrollableViewport,
          droppable: scrollable,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalledTimes(2);
      const scroll2: Position = (mocks.scrollDroppable.mock.calls[1][1]: any);

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
          viewport: unscrollableViewport,
          droppable: scrollable,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalledWith(
        scrollable.descriptor.id,
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
          viewport: unscrollableViewport,
          droppable: scrollable,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalledWith(
        scrollable.descriptor.id,
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
          viewport: unscrollableViewport,
          droppable: scrollable,
          state,
        }),
      );
      scroller.scroll(
        dragTo({
          selection: target2,
          viewport: unscrollableViewport,
          droppable: scrollable,
          state,
        }),
      );

      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalledTimes(1);
      expect(mocks.scrollDroppable).toHaveBeenCalledWith(
        scrollable.descriptor.id,
        patch(axis.line, config.maxPixelScroll),
      );
    });
  });

  describe('moving backward to start of droppable', () => {
    const droppableScroll: Position = patch(axis.line, 10);
    const scrolled: DroppableDimension = scrollDroppable(
      scrollable,
      droppableScroll,
    );

    const onStartBoundary: Position = patch(
      axis.line,
      // at the boundary is not enough to start
      frameClient.borderBox[axis.start] + thresholds.startScrollingFrom,
      frameClient.borderBox.center[axis.crossAxisLine],
    );
    const onMaxBoundary: Position = patch(
      axis.line,
      frameClient.borderBox[axis.start] + thresholds.maxScrollValueAt,
      frameClient.borderBox.center[axis.crossAxisLine],
    );
    const noScrollTarget: Position = add(onStartBoundary, patch(axis.line, 1));

    const startWithNoScroll = (scroller: FluidScroller) => {
      scroller.start(
        dragTo({
          selection: noScrollTarget,
          viewport: unscrollableViewport,
          droppable: scrolled,
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
          viewport: unscrollableViewport,
          droppable: scrolled,
          state,
        }),
      );

      requestAnimationFrame.flush();
      expect(mocks.scrollDroppable).not.toHaveBeenCalled();
    });

    it('should scroll if on the start threshold', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);

      scroller.start(
        dragTo({
          selection: onStartBoundary,
          viewport: unscrollableViewport,
          droppable: scrolled,
          state,
        }),
      );

      expect(mocks.scrollDroppable).not.toHaveBeenCalled();
      requestAnimationFrame.flush();
      expect(mocks.scrollDroppable).toHaveBeenCalled();
    });

    it('should scroll if moving beyond the start threshold', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const target: Position = subtract(onStartBoundary, patch(axis.line, 1));

      scroller.start(
        dragTo({
          selection: target,
          viewport: unscrollableViewport,
          droppable: scrolled,
          state,
        }),
      );

      expect(mocks.scrollDroppable).not.toHaveBeenCalled();

      // only called after a frame
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalled();
      // moving forwards
      const request: Position = mocks.scrollDroppable.mock.calls[0][1];
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
      expect(mocks.scrollDroppable).not.toHaveBeenCalled();

      scroller.scroll(
        dragTo({
          selection: atStartOfRange,
          viewport: unscrollableViewport,
          droppable: scrolled,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalledTimes(1);
      const scroll1: Position = (mocks.scrollDroppable.mock.calls[0][1]: any);

      scroller.scroll(
        dragTo({
          selection: atEndOfRange,
          viewport: unscrollableViewport,
          droppable: scrolled,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalledTimes(2);
      const scroll2: Position = (mocks.scrollDroppable.mock.calls[1][1]: any);

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
          viewport: unscrollableViewport,
          droppable: scrolled,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalledWith(
        scrolled.descriptor.id,
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
          viewport: unscrollableViewport,
          droppable: scrolled,
          state,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalledWith(
        scrolled.descriptor.id,
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
          viewport: unscrollableViewport,
          droppable: scrolled,
          state,
        }),
      );
      scroller.scroll(
        dragTo({
          selection: target2,
          viewport: unscrollableViewport,
          droppable: scrolled,
          state,
        }),
      );

      requestAnimationFrame.step();
      expect(mocks.scrollDroppable).toHaveBeenCalledTimes(1);
      expect(mocks.scrollDroppable).toHaveBeenCalledWith(
        scrolled.descriptor.id,
        negate(patch(axis.line, config.maxPixelScroll)),
      );
    });
  });
});
