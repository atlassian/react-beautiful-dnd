// @flow
import type { Position } from 'css-box-model';
import forEach, { type BlockFnArgs } from './util/for-each';
import { scrollableViewport } from './util/viewport';
import dragTo from './util/drag-to';
import getScroller, {
  type PublicArgs,
  type FluidScroller,
} from '../../../../../src/state/auto-scroller/fluid-scroller';
import getDistanceThresholds, {
  type DistanceThresholds,
} from '../../../../../src/state/auto-scroller/fluid-scroller/get-scroll/get-scroll-on-axis/get-distance-thresholds';
import { patch } from '../../../../../src/state/position';
import getArgsMock from './util/get-args-mock';
import config from '../../../../../src/state/auto-scroller/fluid-scroller/config';
import minScroll from '../../../../../src/state/auto-scroller/fluid-scroller/get-scroll/get-scroll-on-axis/min-scroll';

const stopAt: number = config.durationDampening.stopDampeningAt;
const startAcceleratingAt: number = config.durationDampening.accelerateAt;
const accelerationRange: number = stopAt - startAcceleratingAt;

forEach(({ state, axis }: BlockFnArgs) => {
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

  const originalNow = Date.now;
  let mockNow;

  beforeEach(() => {
    mockNow = jest.fn().mockReturnValue(0);
    // $FlowFixMe - overriding global
    Date.now = mockNow;
  });

  afterEach(() => {
    mockNow.mockClear();
    // $FlowFixMe - overriding global
    Date.now = originalNow;
  });

  it('should not dampen scrolling if not starting in scrollable area', () => {
    const mocks: PublicArgs = getArgsMock();
    const scroller: FluidScroller = getScroller(mocks);

    // no scroll on initial lift
    scroller.start(
      dragTo({
        selection: scrollableViewport.frame.center,
        viewport: scrollableViewport,
        state,
      }),
    );
    requestAnimationFrame.flush();
    expect(mocks.scrollWindow).not.toHaveBeenCalled();

    // would be a max scroll
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

  it('should dampen if lifted in a scrollable area', () => {
    // on start of boundary: would have been a min scroll anyway
    {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);

      // lifting in scrollable area
      scroller.start(
        dragTo({
          selection: onStartBoundary,
          viewport: scrollableViewport,
          state,
        }),
      );

      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledWith(
        patch(axis.line, minScroll),
      );
    }
    // would normally be max scroll speed
    {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);

      // lifting in scrollable area
      scroller.start(
        dragTo({
          selection: onMaxBoundary,
          viewport: scrollableViewport,
          state,
        }),
      );

      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledWith(
        patch(axis.line, minScroll),
      );
    }
  });

  it('should have the minimum scroll up to a small time threshold and then accelerate to the max speed as time continues', () => {
    const mocks: PublicArgs = getArgsMock();
    const scroller: FluidScroller = getScroller(mocks);

    // starting on the max boundary which normally
    scroller.start(
      dragTo({
        selection: onMaxBoundary,
        viewport: scrollableViewport,
        state,
      }),
    );
    requestAnimationFrame.step();
    expect(mocks.scrollWindow).toHaveBeenCalledWith(
      patch(axis.line, minScroll),
    );
    mocks.scrollWindow.mockClear();

    // moving up to just before the acceleration point
    mockNow.mockReturnValueOnce(startAcceleratingAt - 1);
    scroller.scroll(
      dragTo({
        selection: onMaxBoundary,
        viewport: scrollableViewport,
        state,
      }),
    );

    // still on the min scroll
    requestAnimationFrame.step();
    expect(mocks.scrollWindow).toHaveBeenCalledWith(
      patch(axis.line, minScroll),
    );
    mocks.scrollWindow.mockClear();

    // now on the acceleration start point
    mockNow.mockReturnValueOnce(startAcceleratingAt);
    scroller.scroll(
      dragTo({
        selection: onMaxBoundary,
        viewport: scrollableViewport,
        state,
      }),
    );
    requestAnimationFrame.step();
    // still on the min scroll as the % change will be quite low
    expect(mocks.scrollWindow).toHaveBeenCalledWith(
      patch(axis.line, minScroll),
    );
    mocks.scrollWindow.mockClear();

    // Moving 30% of the way into the time dampening period
    mockNow.mockReturnValueOnce(startAcceleratingAt + accelerationRange * 0.3);
    scroller.scroll(
      dragTo({
        selection: onMaxBoundary,
        viewport: scrollableViewport,
        state,
      }),
    );
    requestAnimationFrame.step();
    const firstAcceleratedScroll: Position =
      mocks.scrollWindow.mock.calls[0][0];
    expect(firstAcceleratedScroll[axis.line]).toBeGreaterThan(minScroll);
    expect(firstAcceleratedScroll[axis.line]).toBeLessThan(
      config.maxPixelScroll,
    );
    mocks.scrollWindow.mockClear();

    // Now passing event more time (60%)
    mockNow.mockReturnValueOnce(startAcceleratingAt + accelerationRange * 0.6);
    scroller.scroll(
      dragTo({
        selection: onMaxBoundary,
        viewport: scrollableViewport,
        state,
      }),
    );
    requestAnimationFrame.step();
    const secondAcceleratedScroll: Position =
      mocks.scrollWindow.mock.calls[0][0];
    // is greater in acceleration
    expect(secondAcceleratedScroll[axis.line]).toBeGreaterThan(
      firstAcceleratedScroll[axis.line],
    );
    expect(secondAcceleratedScroll[axis.line]).toBeGreaterThan(minScroll);
    expect(secondAcceleratedScroll[axis.line]).toBeLessThan(
      config.maxPixelScroll,
    );
    mocks.scrollWindow.mockClear();

    // Moving to the end of the time dampening period
    mockNow.mockReturnValueOnce(stopAt);
    scroller.scroll(
      dragTo({
        selection: onMaxBoundary,
        viewport: scrollableViewport,
        state,
      }),
    );
    requestAnimationFrame.step();
    const lastAcceleratedScroll: Position = mocks.scrollWindow.mock.calls[0][0];
    // is greater in acceleration
    expect(lastAcceleratedScroll[axis.line]).toBeGreaterThan(
      firstAcceleratedScroll[axis.line],
    );
    expect(lastAcceleratedScroll[axis.line]).toBeGreaterThan(minScroll);
    expect(lastAcceleratedScroll[axis.line]).toEqual(config.maxPixelScroll);
  });
});
