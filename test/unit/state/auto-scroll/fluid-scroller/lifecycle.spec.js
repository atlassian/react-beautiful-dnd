// @flow

import forEach, { type BlockFnArgs } from './util/for-each';
import type { DraggingState } from '../../../../../src/types';
import getScroller from './util/get-scroller';
import { type FluidScroller } from '../../../../../src/state/auto-scroller/fluid-scroller';

forEach(({ state }: BlockFnArgs) => {
  const base: DraggingState = state.dragging();
  it('should throw if a scroll occurs before a drag as started', () => {
    const scroller: FluidScroller = getScroller();
    expect(() => scroller.scroll(base)).toThrow();

    // after a drag
    scroller.start(base);
    scroller.stop();

    expect(() => scroller.scroll(base)).toThrow();
  });

  it('should allow subsequent drags', () => {
    const scroller: FluidScroller = getScroller();
    const run = () => {
      scroller.start(base);
      scroller.stop();
    };

    Array.from({ length: 1 }).forEach(() => {
      expect(run).not.toThrow();
    });
  });

  it('should allow defensive stop calls', () => {
    const scroller: FluidScroller = getScroller();
    // newly created - not started
    scroller.stop();

    // started and then stopped multiple times
    scroller.start(base);
    scroller.stop();
    scroller.stop();
    scroller.stop();
  });

  it('should throw if started multiple times', () => {
    const scroller: FluidScroller = getScroller();
    scroller.start(base);
    expect(() => scroller.start(base)).toThrow();
  });

  it('should cancel any pending scrolls when stopped', () => {
    throw new Error('TODO');
  });
});
